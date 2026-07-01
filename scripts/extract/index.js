#!/usr/bin/env node
// CLI: node scripts/extract/index.js <repo_path> [--service <service_id>] [--out <facts.json path>]
//
// Walks <repo_path> per manifest.json's glob->extractor mapping, runs the
// matching extractor on each file (skipping unchanged files via a content
// hash cache), and writes an aggregated facts.json — the deterministic
// ground truth consulted by dependency-analysis and other skills (see
// skills/static-index/SKILL.md).
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve, join, relative, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import fg from "fast-glob";
import { hashContent, loadCache, saveCache } from "./lib/cache.js";

const HERE = dirname(fileURLToPath(import.meta.url));

function parseArgs(argv) {
  const args = { repo: null, service: null, out: null };
  const rest = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--service") args.service = argv[++i];
    else if (argv[i] === "--out") args.out = argv[++i];
    else rest.push(argv[i]);
  }
  args.repo = rest[0];
  return args;
}

async function loadManifest() {
  const raw = await readFile(join(HERE, "manifest.json"), "utf8");
  return JSON.parse(raw);
}

async function main() {
  const { repo, service, out } = parseArgs(process.argv.slice(2));
  if (!repo) {
    console.error("Usage: node scripts/extract/index.js <repo_path> [--service <id>] [--out <facts.json>]");
    process.exit(1);
  }
  const repoPath = resolve(repo);
  const manifest = await loadManifest();

  const outPath = out
    ? resolve(out)
    : join(repoPath, ".analysis", "index", service ?? "default", "facts.json");
  const cachePath = join(dirname(outPath), ".cache.json");
  await mkdir(dirname(outPath), { recursive: true });

  const cache = await loadCache(cachePath);
  const newCache = {};
  const files = [];
  let reused = 0;
  let extracted = 0;
  let failed = 0;

  for (const extractor of manifest.extractors) {
    const matches = await fg(extractor.globs, {
      cwd: repoPath,
      ignore: manifest.ignore,
      onlyFiles: true,
      dot: false,
    });
    if (matches.length === 0) continue;

    const mod = await import(pathToFileURL(join(HERE, extractor.module.replace(/^\.\//, ""))).href);
    const extractFn = mod[extractor.export];

    for (const relPath of matches) {
      const absPath = join(repoPath, relPath);
      const content = await readFile(absPath, "utf8");
      const hash = hashContent(content);
      const cacheKey = `${extractor.id}:${relPath}`;

      if (cache[cacheKey]?.hash === hash) {
        files.push(cache[cacheKey].facts);
        newCache[cacheKey] = cache[cacheKey];
        reused++;
        continue;
      }

      try {
        const facts = extractor.mode
          ? await extractFn(absPath, extractor.mode)
          : await extractFn(absPath);
        facts.path = relative(repoPath, absPath).replace(/\\/g, "/");
        files.push(facts);
        newCache[cacheKey] = { hash, facts };
        extracted++;
      } catch (err) {
        files.push({
          path: relative(repoPath, absPath).replace(/\\/g, "/"),
          language: extractor.id,
          symbols: [],
          endpoints: [],
          outbound_calls: [],
          db_access: [],
          imports: [],
          error: `extractor_error: ${err.message}`,
        });
        failed++;
      }
    }
  }

  const factsDoc = {
    service_id: service ?? null,
    generated_at: new Date().toISOString(),
    files,
  };

  await writeFile(outPath, JSON.stringify(factsDoc, null, 2), "utf8");
  await saveCache(cachePath, newCache);

  console.log(
    `facts.json written to ${outPath} — ${files.length} files (${extracted} extracted, ${reused} cached, ${failed} failed)`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
