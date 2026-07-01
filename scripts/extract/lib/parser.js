// Thin wrapper around web-tree-sitter: one WASM-backed parser per grammar,
// cached so repeated files in the same run don't re-load the grammar.
import { Parser, Language } from "web-tree-sitter";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

let initialized = false;
const languageCache = new Map();

const GRAMMAR_WASM = {
  java: require.resolve("tree-sitter-wasms/out/tree-sitter-java.wasm"),
  typescript: require.resolve("tree-sitter-wasms/out/tree-sitter-typescript.wasm"),
  javascript: require.resolve("tree-sitter-wasms/out/tree-sitter-javascript.wasm"),
};

async function ensureInit() {
  if (!initialized) {
    await Parser.init();
    initialized = true;
  }
}

/** @param {"java"|"typescript"|"javascript"} grammarName */
export async function getParser(grammarName) {
  await ensureInit();
  const wasmPath = GRAMMAR_WASM[grammarName];
  if (!wasmPath) {
    throw new Error(`No bundled grammar for "${grammarName}"`);
  }
  let language = languageCache.get(grammarName);
  if (!language) {
    language = await Language.load(wasmPath);
    languageCache.set(grammarName, language);
  }
  const parser = new Parser();
  parser.setLanguage(language);
  return parser;
}
