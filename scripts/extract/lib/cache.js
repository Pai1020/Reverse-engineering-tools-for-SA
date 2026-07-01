import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

export function hashContent(content) {
  return createHash("sha1").update(content).digest("hex");
}

export async function loadCache(cachePath) {
  try {
    return JSON.parse(await readFile(cachePath, "utf8"));
  } catch {
    return {};
  }
}

export async function saveCache(cachePath, cache) {
  await writeFile(cachePath, JSON.stringify(cache, null, 2), "utf8");
}
