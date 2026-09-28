import type { PackedFile } from "@/lib/bench/files";

export const SAMPLE_LABEL = "desk-lamp";

export const SAMPLE_SITE: PackedFile[] = [
  {
    path: "index.html",
    mime: "text/html",
    encoding: "utf8",
    data: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Desk lamp</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <main>
    <p class="kicker">Dropped site</p>
    <h1>Desk lamp</h1>
    <p>A small page from a zip. The lamp uses the stylesheet and script packed beside this file.</p>
    <button id="lamp" type="button">Turn the lamp on</button>
    <p id="status">The desk is dark.</p>
  </main>
  <script src="main.js"></script>
</body>
</html>`,
  },
  {
    path: "styles.css",
    mime: "text/css",
    encoding: "utf8",
    data: `:root { color-scheme: light; }
* { box-sizing: border-box; }
body {
  margin: 0;
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: #241c16;
  color: #f4efe6;
  font: 18px/1.5 Georgia, "Iowan Old Style", serif;
}
body.on { background: #f4efe6; color: #241c16; }
main { width: min(36rem, calc(100% - 2rem)); }
.kicker { letter-spacing: 0.14em; text-transform: uppercase; font: 12px/1.4 ui-sans-serif, system-ui, sans-serif; }
h1 { font-size: 3rem; font-weight: 500; margin: 0.2rem 0 0.6rem; }
button {
  margin-top: 1rem;
  min-height: 44px;
  padding: 0 1rem;
  border: 1px solid currentColor;
  background: transparent;
  color: inherit;
  font: inherit;
  cursor: pointer;
}
#status { font: 15px/1.4 ui-sans-serif, system-ui, sans-serif; }`,
  },
  {
    path: "main.js",
    mime: "text/javascript",
    encoding: "utf8",
    data: `const button = document.querySelector("#lamp");
const status = document.querySelector("#status");
let on = false;
button.addEventListener("click", () => {
  on = !on;
  document.body.classList.toggle("on", on);
  button.textContent = on ? "Turn the lamp off" : "Turn the lamp on";
  status.textContent = on ? "The desk is lit." : "The desk is dark.";
});`,
  },
];
