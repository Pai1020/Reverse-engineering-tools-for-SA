// MyBatis mapper XML extractor: statement id/type, referenced tables (naive
// SQL scan), parameterType/resultType/resultMap. Plain XML parse — no AST
// needed for this format.
import { readFile } from "node:fs/promises";
import { XMLParser } from "fast-xml-parser";
import { extractTablesFromSql } from "./lib/sql-tables.js";

const STATEMENT_TAGS = ["select", "insert", "update", "delete"];

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
  preserveOrder: false,
});

function asArray(value) {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

function statementText(stmt) {
  if (typeof stmt === "string") return stmt;
  if (stmt && typeof stmt === "object") {
    // Mixed content (text + <if>/<where>/etc.) collapses into #text plus
    // nested tag objects; concatenate whatever plain text is present.
    const parts = [];
    for (const [key, val] of Object.entries(stmt)) {
      if (key.startsWith("@_")) continue;
      if (key === "#text") parts.push(String(val));
      else if (typeof val === "object") parts.push(statementText(val));
      else parts.push(String(val));
    }
    return parts.join(" ");
  }
  return "";
}

export async function extractMyBatisXmlFile(filePath) {
  const source = await readFile(filePath, "utf8");
  const dbAccess = [];
  let namespace = null;

  try {
    const doc = parser.parse(source);
    const mapper = doc.mapper;
    if (mapper) {
      namespace = mapper["@_namespace"] ?? null;
      for (const tag of STATEMENT_TAGS) {
        for (const stmt of asArray(mapper[tag])) {
          if (!stmt || typeof stmt !== "object") continue;
          const sqlText = statementText(stmt);
          dbAccess.push({
            statement_id: stmt["@_id"] ?? null,
            type: tag,
            tables: extractTablesFromSql(sqlText),
            parameter_type: stmt["@_parameterType"] ?? null,
            result_type: stmt["@_resultType"] ?? null,
            result_map: stmt["@_resultMap"] ?? null,
            source: "mybatis-xml",
          });
        }
      }
    }
  } catch (err) {
    // Malformed/unsupported XML: report the file with no statements rather
    // than crashing the whole extraction run.
    return {
      path: filePath,
      language: "mybatis-xml",
      symbols: [],
      endpoints: [],
      outbound_calls: [],
      db_access: [],
      imports: [],
      error: `xml_parse_error: ${err.message}`,
    };
  }

  return {
    path: filePath,
    language: "mybatis-xml",
    symbols: namespace ? [{ kind: "mapper_namespace", name: namespace }] : [],
    endpoints: [],
    outbound_calls: [],
    db_access: dbAccess,
    imports: [],
  };
}
