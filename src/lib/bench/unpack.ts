import { unzipSync } from "fflate";
import { isTextPath, mimeFor, validatePacked, type PackedFile } from "@/lib/bench/files";

const MAX_ZIP_BYTES = 1_500_000;
const MAX_FILE_BYTES = 350_000;

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  const step = 0x8000;
  for (let index = 0; index < bytes.length; index += step) {
    binary += String.fromCharCode(...bytes.subarray(index, index + step));
  }
  return btoa(binary);
}

export function unpackZip(bytes: Uint8Array): { files: PackedFile[] } | { error: string } {
  if (bytes.byteLength > MAX_ZIP_BYTES) return { error: "That zip is too large to run in the room." };
  let extracted: Record<string, Uint8Array>;
  try {
    let claimed = 0;
    extracted = unzipSync(bytes, {
      filter(file) {
        if (file.compression !== 0 && file.compression !== 8) return false;
        if (file.originalSize > MAX_FILE_BYTES) return false;
        if (claimed + file.originalSize > MAX_ZIP_BYTES) return false;
        claimed += file.originalSize;
        return true;
      },
    });
  } catch {
    return { error: "That file is not a zip this preview can open." };
  }
  const packed: PackedFile[] = [];
  for (const [name, data] of Object.entries(extracted)) {
    const mime = mimeFor(name);
    if (!mime || !data?.length) continue;
    if (isTextPath(name)) {
      packed.push({
        path: name,
        mime,
        encoding: "utf8",
        data: new TextDecoder("utf-8", { fatal: false }).decode(data),
      });
    } else {
      packed.push({ path: name, mime, encoding: "base64", data: toBase64(data) });
    }
  }
  return validatePacked(packed);
}
