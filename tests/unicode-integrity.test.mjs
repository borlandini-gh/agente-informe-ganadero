import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { extname, resolve } from "node:path";
import test from "node:test";

const root = resolve(new URL("..", import.meta.url).pathname);
const textExtensions = new Set([".css", ".example", ".gitignore", ".json", ".md", ".mjs", ".sh", ".ts", ".tsx"]);
const forbiddenCodePoints = new Set([
  0x061c,
  ...Array.from({ length: 5 }, (_, index) => 0x200b + index),
  ...Array.from({ length: 5 }, (_, index) => 0x202a + index),
  ...Array.from({ length: 10 }, (_, index) => 0x2060 + index),
  0xfeff,
]);

async function textFiles(directory) {
  const output = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (["node_modules", ".next", "dist"].includes(entry.name)) continue;
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) output.push(...await textFiles(path));
    else if (textExtensions.has(extname(entry.name)) || textExtensions.has(entry.name)) output.push(path);
  }
  return output;
}

test("el repositorio no contiene caracteres de formato ocultos ni controles bidireccionales", async () => {
  for (const path of await textFiles(root)) {
    const contents = await readFile(path, "utf8");
    for (const character of contents) {
      assert(!forbiddenCodePoints.has(character.codePointAt(0)), `Carácter de formato no permitido en ${path}.`);
    }
  }
});
