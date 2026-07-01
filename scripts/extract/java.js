// Java extractor: classes/interfaces + methods (with signatures), Spring
// annotations (REST endpoints, DI edges), MyBatis mapper interface markers.
// Deterministic (AST-based) facts only — no interpretation of business logic.
import { readFile } from "node:fs/promises";
import { getParser } from "./lib/parser.js";
import { extractTablesFromSql } from "./lib/sql-tables.js";

const HTTP_MAPPING_ANNOTATIONS = {
  GetMapping: "GET",
  PostMapping: "POST",
  PutMapping: "PUT",
  DeleteMapping: "DELETE",
  PatchMapping: "PATCH",
};
const DI_ANNOTATIONS = new Set(["Autowired", "Inject", "Resource"]);
const COMPONENT_ANNOTATIONS = new Set([
  "Service", "Repository", "Component", "Controller", "RestController", "Configuration",
]);
const HTTP_CLIENT_HINTS = ["RestTemplate", "WebClient", "FeignClient", "HttpClient"];

// JPA: repository interfaces have no XML — the entity/@Query/derived-method
// name IS the schema evidence, so it's extracted here rather than needing a
// second file format.
const JPA_REPOSITORY_MARKERS = new Set([
  "JpaRepository", "CrudRepository", "PagingAndSortingRepository",
  "ListCrudRepository", "ListPagingAndSortingRepository", "Repository",
]);
const DERIVED_QUERY_PREFIX =
  /^(findAllBy|findFirstBy|findTopBy|findBy|getBy|readBy|queryBy|streamBy|existsBy|countBy|deleteBy|removeBy)(.*)$/;
const DERIVED_QUERY_VERB = {
  findAllBy: "select", findFirstBy: "select", findTopBy: "select", findBy: "select",
  getBy: "select", readBy: "select", queryBy: "select", streamBy: "select",
  existsBy: "exists", countBy: "count", deleteBy: "delete", removeBy: "delete",
};

function findStringFragments(node) {
  const out = [];
  const stack = [node];
  while (stack.length) {
    const n = stack.pop();
    if (n.type === "string_fragment") out.push(n.text);
    for (const c of n.namedChildren) stack.push(c);
  }
  return out;
}

function parseAnnotation(node) {
  const name =
    node.childForFieldName?.("name")?.text ??
    node.namedChildren.find((c) => c.type === "identifier" || c.type === "scoped_identifier")?.text ??
    "";
  const argList = node.namedChildren.find((c) => c.type === "annotation_argument_list");
  const values = argList ? findStringFragments(argList) : [];
  const named = {};
  if (argList) {
    for (const c of argList.namedChildren) {
      if (c.type === "element_value_pair") {
        const key = c.namedChildren[0]?.text;
        const valueNode = c.namedChildren[1];
        // string_literal -> its fragment; everything else (true/false,
        // numbers, enum constants) -> raw text, since it isn't a string.
        const val = valueNode
          ? valueNode.type === "string_literal"
            ? findStringFragments(valueNode)[0] ?? null
            : valueNode.text
          : null;
        if (key) named[key] = val;
      }
    }
  }
  return { name, values, named };
}

function annotationsOf(declNode) {
  const modifiers = declNode.namedChildren.find((c) => c.type === "modifiers");
  if (!modifiers) return [];
  return modifiers.namedChildren
    .filter((c) => c.type === "annotation" || c.type === "marker_annotation")
    .map(parseAnnotation);
}

function lineOf(node) {
  return node.startPosition.row + 1;
}

function endLineOf(node) {
  return node.endPosition.row + 1;
}

function classLevelBasePath(annotations) {
  const mapping = annotations.find((a) => a.name === "RequestMapping");
  if (!mapping) return "";
  return mapping.values[0] ?? mapping.named.value ?? mapping.named.path ?? "";
}

function joinPath(base, sub) {
  const b = (base || "").replace(/\/+$/, "");
  const s = (sub || "").replace(/^\/+/, "");
  if (!b && !s) return "/";
  return `${b}/${s}`.replace(/\/+/g, "/") || "/";
}

/** Walk class_declaration / interface_declaration / record_declaration nodes at any depth. */
function* walkTypeDeclarations(node, outerName = null) {
  for (const child of node.namedChildren) {
    if (["class_declaration", "interface_declaration", "record_declaration"].includes(child.type)) {
      const name = child.childForFieldName("name")?.text ?? "(anonymous)";
      const qualifiedName = outerName ? `${outerName}.${name}` : name;
      yield { node: child, name, qualifiedName };
      const body = child.childForFieldName("body");
      if (body) yield* walkTypeDeclarations(body, qualifiedName);
    } else if (child.namedChildCount > 0) {
      yield* walkTypeDeclarations(child, outerName);
    }
  }
}

function extractMethods(typeNode) {
  const body = typeNode.childForFieldName("body");
  if (!body) return [];
  return body.namedChildren
    .filter((c) => c.type === "method_declaration" || c.type === "constructor_declaration")
    .map((m) => {
      const name = m.childForFieldName("name")?.text ?? "(unknown)";
      const returnType = m.childForFieldName("type")?.text ?? null;
      const params = m.childForFieldName("parameters")?.text ?? "()";
      const anns = annotationsOf(m);
      return {
        name,
        signature: `${returnType ? returnType + " " : ""}${name}${params}`,
        annotations: anns.map((a) => a.name),
        start_line: lineOf(m),
        end_line: endLineOf(m),
      };
    });
}

function extractFields(typeNode) {
  const body = typeNode.childForFieldName("body");
  if (!body) return [];
  return body.namedChildren
    .filter((c) => c.type === "field_declaration")
    .flatMap((f) => {
      const anns = annotationsOf(f);
      const fieldType = f.childForFieldName("type")?.text ?? null;
      const declarators = f.namedChildren.filter((c) => c.type === "variable_declarator");
      return declarators.map((d) => ({
        name: d.childForFieldName("name")?.text ?? d.namedChildren[0]?.text ?? "(unknown)",
        type: fieldType,
        annotations: anns.map((a) => a.name),
        start_line: lineOf(f),
      }));
    });
}

function extractImports(rootNode) {
  return rootNode.namedChildren
    .filter((c) => c.type === "import_declaration")
    .map((c) => c.text.replace(/^import\s+/, "").replace(/;$/, "").trim());
}

function entityTableName(annotations) {
  const tableAnn = annotations.find((a) => a.name === "Table");
  if (!tableAnn) return null;
  return tableAnn.named.name ?? tableAnn.values[0] ?? null;
}

/** For an interface_declaration: does it extend a JPA repository base, and with what <Entity, Id>? */
function jpaRepositoryInfo(typeNode) {
  if (typeNode.type !== "interface_declaration") return null;
  const extendsNode = typeNode.namedChildren.find((c) => c.type === "extends_interfaces");
  if (!extendsNode) return null;
  const typeList = extendsNode.namedChildren.find((c) => c.type === "type_list") ?? extendsNode;
  for (const iface of typeList.namedChildren) {
    const isGeneric = iface.type === "generic_type";
    const baseName = isGeneric
      ? iface.namedChildren.find((c) => c.type === "type_identifier")?.text
      : iface.type === "type_identifier"
      ? iface.text
      : null;
    if (baseName && JPA_REPOSITORY_MARKERS.has(baseName)) {
      const typeArgs = isGeneric ? iface.namedChildren.find((c) => c.type === "type_arguments") : null;
      const args = typeArgs ? typeArgs.namedChildren.map((a) => a.text) : [];
      return { base: baseName, entity_type: args[0] ?? null, id_type: args[1] ?? null };
    }
  }
  return null;
}

function parseDerivedQueryMethod(methodName) {
  const m = DERIVED_QUERY_PREFIX.exec(methodName);
  if (!m) return null;
  const [, prefix, rest] = m;
  const criteria = rest ? rest.split(/And|Or/).map((s) => s.trim()).filter(Boolean) : [];
  return { verb: DERIVED_QUERY_VERB[prefix] ?? "select", criteria };
}

/** Repository interface methods -> db_access entries (JPA has no XML; the interface IS the schema evidence). */
function extractRepositoryQueries(typeNode, qualifiedName, repoInfo) {
  const body = typeNode.childForFieldName("body");
  if (!body) return [];
  const entries = [];
  for (const m of body.namedChildren) {
    if (m.type !== "method_declaration") continue;
    const name = m.childForFieldName("name")?.text ?? "(unknown)";
    const anns = annotationsOf(m);
    const queryAnn = anns.find((a) => a.name === "Query");
    const statementId = `${qualifiedName}#${name}`;

    if (queryAnn) {
      const queryText = queryAnn.values[0] ?? queryAnn.named.value ?? null;
      const isNative = (queryAnn.named.nativeQuery ?? "false") === "true";
      const verbMatch = /^\s*(insert|update|delete)\b/i.exec(queryText ?? "");
      entries.push({
        statement_id: statementId,
        type: verbMatch ? verbMatch[1].toLowerCase() : "select",
        tables: isNative ? extractTablesFromSql(queryText ?? "") : [],
        entity_type: isNative ? null : repoInfo.entity_type,
        parameter_type: null,
        result_type: repoInfo.entity_type,
        source: isNative ? "jpa-query-native" : "jpa-query-jpql",
        query_text: queryText,
      });
    } else {
      const derived = parseDerivedQueryMethod(name);
      if (derived) {
        entries.push({
          statement_id: statementId,
          type: derived.verb,
          tables: [],
          entity_type: repoInfo.entity_type,
          parameter_type: null,
          result_type: repoInfo.entity_type,
          source: "jpa-derived",
          criteria_fields: derived.criteria,
        });
      }
    }
  }
  return entries;
}

function extractOutboundHttpCalls(typeNode, sourceText) {
  // Heuristic within this type's own text span: method invocations on known
  // HTTP-client-shaped receivers, plus any literal http(s):// URL strings.
  const calls = [];
  const text = sourceText.slice(typeNode.startIndex, typeNode.endIndex);
  const urlRegex = /["'`](https?:\/\/[^"'`\s]+)["'`]/g;
  let m;
  while ((m = urlRegex.exec(text))) {
    calls.push({ kind: "http", url_expression: m[1], evidence: "literal_url" });
  }
  for (const hint of HTTP_CLIENT_HINTS) {
    if (text.includes(hint)) {
      calls.push({ kind: "http", url_expression: null, evidence: `client_type:${hint}` });
    }
  }
  return calls;
}

export async function extractJavaFile(filePath) {
  const source = await readFile(filePath, "utf8");
  const parser = await getParser("java");
  const tree = parser.parse(source);

  const symbols = [];
  const endpoints = [];
  const outboundCalls = [];
  const dbAccess = [];

  for (const { node: typeNode, qualifiedName } of walkTypeDeclarations(tree.rootNode)) {
    const anns = annotationsOf(typeNode);
    const annNames = anns.map((a) => a.name);
    const isMapper =
      annNames.includes("Mapper") || /Mapper$/.test(qualifiedName.split(".").pop());
    const isRestController = annNames.includes("RestController") || annNames.includes("Controller");
    const isComponent = annNames.some((n) => COMPONENT_ANNOTATIONS.has(n));
    const isJpaEntity = annNames.includes("Entity");
    const jpaTableName = isJpaEntity ? entityTableName(anns) : null;
    const repoInfo = jpaRepositoryInfo(typeNode);

    const methods = extractMethods(typeNode);
    const fields = extractFields(typeNode);
    const diEdges = fields
      .filter((f) => f.annotations.some((a) => DI_ANNOTATIONS.has(a)))
      .map((f) => ({ field: f.name, injected_type: f.type }));

    symbols.push({
      kind: typeNode.type.replace("_declaration", ""),
      name: qualifiedName,
      annotations: annNames,
      is_mapper_interface: isMapper,
      is_spring_component: isComponent,
      is_jpa_entity: isJpaEntity,
      table_name: jpaTableName,
      is_jpa_repository: Boolean(repoInfo),
      repository_entity_type: repoInfo?.entity_type ?? null,
      repository_id_type: repoInfo?.id_type ?? null,
      di_edges: diEdges,
      methods,
      start_line: lineOf(typeNode),
      end_line: endLineOf(typeNode),
    });

    if (repoInfo) {
      dbAccess.push(...extractRepositoryQueries(typeNode, qualifiedName, repoInfo));
    }

    if (isRestController) {
      const basePath = classLevelBasePath(anns);
      for (const method of typeNode.childForFieldName("body")?.namedChildren ?? []) {
        if (method.type !== "method_declaration") continue;
        const methodAnns = annotationsOf(method).filter(
          (a) => a.name in HTTP_MAPPING_ANNOTATIONS || a.name === "RequestMapping"
        );
        for (const a of methodAnns) {
          const subPath = a.values[0] ?? a.named.value ?? a.named.path ?? "";
          const httpMethod =
            HTTP_MAPPING_ANNOTATIONS[a.name] ?? (a.named.method ?? "GET").toUpperCase();
          endpoints.push({
            http_method: httpMethod,
            path: joinPath(basePath, subPath),
            handler_symbol: `${qualifiedName}#${method.childForFieldName("name")?.text}`,
            framework: "spring-mvc",
            start_line: lineOf(method),
          });
        }
      }
    }

    outboundCalls.push(...extractOutboundHttpCalls(typeNode, source));
  }

  return {
    path: filePath,
    language: "java",
    symbols,
    endpoints,
    outbound_calls: outboundCalls,
    db_access: dbAccess,
    imports: extractImports(tree.rootNode),
  };
}
