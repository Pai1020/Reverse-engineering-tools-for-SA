// Frontend extractor: shared TypeScript/JavaScript grammar for both Angular
// and Vue. Angular: .ts files parsed directly. Vue: the SFC <script> block is
// split out first (plain text split, not AST — SFC itself isn't a tree-sitter
// grammar target here), then parsed with the same grammar.
//
// Deterministic facts only: decorators/component names, outbound HTTP calls
// (axios/$axios/fetch/HttpClient), imports. Route-table extraction is a
// documented gap for a future pass (see skills/static-index/SKILL.md).
import { readFile } from "node:fs/promises";
import { getParser } from "./lib/parser.js";

const HTTP_CALL_RECEIVERS = ["http", "$axios", "axios", "$http"];
const HTTP_METHODS = ["get", "post", "put", "delete", "patch", "$get", "$post", "$put", "$delete"];

function lineOf(node) {
  return node.startPosition.row + 1;
}

function stringLiteralText(node) {
  if (!node) return null;
  if (node.type === "string") {
    const frag = node.namedChildren.find((c) => c.type === "string_fragment");
    return frag ? frag.text : null;
  }
  if (node.type === "template_string") {
    // Only the literal prefix before the first substitution is reliable.
    return node.text.replace(/^`|`$/g, "");
  }
  return null;
}

function decoratorsPrecedingNode(node) {
  const decorators = [];
  let sibling = node.previousNamedSibling;
  while (sibling && sibling.type === "decorator") {
    decorators.unshift(sibling);
    sibling = sibling.previousNamedSibling;
  }
  return decorators.map((d) => {
    const call = d.namedChildren.find((c) => c.type === "call_expression");
    const name = call
      ? call.namedChildren[0]?.text
      : d.namedChildren.find((c) => c.type === "identifier")?.text;
    return { name: name ?? "(unknown)", start_line: lineOf(d) };
  });
}

function* walkClassDeclarations(node) {
  for (const child of node.namedChildren) {
    if (child.type === "class_declaration") {
      yield child;
    }
    yield* walkClassDeclarations(child);
  }
}

function extractImports(rootNode) {
  return rootNode.namedChildren
    .filter((c) => c.type === "import_statement")
    .map((c) => {
      const src = c.namedChildren.find((n) => n.type === "string");
      return stringLiteralText(src);
    })
    .filter(Boolean);
}

function isHttpCall(callExpr) {
  const fn = callExpr.namedChildren[0];
  if (!fn || fn.type !== "member_expression") return false;
  const property = fn.childForFieldName("property")?.text;
  const object = fn.childForFieldName("object");
  if (!property || !HTTP_METHODS.includes(property)) return false;
  const objectText = object?.text ?? "";
  return HTTP_CALL_RECEIVERS.some((r) => objectText === r || objectText.endsWith(`.${r}`) || objectText === `this.${r}`);
}

function firstArgUrl(callExpr) {
  const args = callExpr.namedChildren.find((c) => c.type === "arguments");
  if (!args || args.namedChildCount === 0) return { literal: null, dynamic: true };
  const first = args.namedChildren[0];
  const literal = stringLiteralText(first);
  if (literal !== null) return { literal, dynamic: false };
  if (first.type === "binary_expression") {
    // e.g. `'/api/foo/' + id` — take the literal left-hand prefix.
    const left = first.childForFieldName("left");
    const leftLiteral = stringLiteralText(left);
    return { literal: leftLiteral, dynamic: true };
  }
  return { literal: null, dynamic: true };
}

function extractOutboundCalls(rootNode) {
  const calls = [];
  const stack = [rootNode];
  while (stack.length) {
    const node = stack.pop();
    if (node.type === "call_expression" && isHttpCall(node)) {
      const fn = node.namedChildren[0];
      const method = fn.childForFieldName("property")?.text;
      const { literal, dynamic } = firstArgUrl(node);
      calls.push({
        kind: "http",
        http_method: (method ?? "").replace(/^\$/, "").toUpperCase(),
        url_expression: literal,
        dynamic_suffix: dynamic,
        start_line: lineOf(node),
      });
    }
    for (const c of node.namedChildren) stack.push(c);
  }
  return calls;
}

async function parseWithGrammar(source, grammar) {
  const parser = await getParser(grammar);
  return parser.parse(source);
}

function extractVueScriptBlock(source) {
  const match = source.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
  if (!match) return { script: "", offset: 0 };
  const offset = source.slice(0, match.index).split("\n").length - 1;
  return { script: match[1], offset };
}

export async function extractFrontendFile(filePath, mode) {
  const raw = await readFile(filePath, "utf8");
  const isVue = mode === "vue";
  const { script, offset } = isVue ? extractVueScriptBlock(raw) : { script: raw, offset: 0 };

  if (isVue && !script.trim()) {
    return { path: filePath, language: "vue", symbols: [], endpoints: [], outbound_calls: [], db_access: [], imports: [] };
  }

  // Vue SFCs are usually plain JS/TS in the script block; TSX-safe grammar
  // handles both TS and JS syntax, so use it uniformly here.
  const tree = await parseWithGrammar(script, "typescript");

  const symbols = [];
  for (const cls of walkClassDeclarations(tree.rootNode)) {
    const name = cls.childForFieldName("name")?.text ?? "(anonymous)";
    const decorators = decoratorsPrecedingNode(cls);
    symbols.push({
      kind: "class",
      name,
      decorators: decorators.map((d) => d.name),
      is_component: decorators.some((d) => d.name === "Component"),
      is_injectable: decorators.some((d) => d.name === "Injectable"),
      start_line: lineOf(cls) + offset,
      end_line: cls.endPosition.row + 1 + offset,
    });
  }

  const outboundCalls = extractOutboundCalls(tree.rootNode).map((c) => ({
    ...c,
    start_line: c.start_line + offset,
  }));

  return {
    path: filePath,
    language: isVue ? "vue" : "typescript",
    symbols,
    endpoints: [],
    outbound_calls: outboundCalls,
    db_access: [],
    imports: extractImports(tree.rootNode),
  };
}
