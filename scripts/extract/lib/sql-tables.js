// Naive SQL table-reference scan, shared by the MyBatis XML extractor and
// the JPA native-@Query extractor. Not a SQL parser — just enough to surface
// candidate table names for a human/skill to confirm.
export function extractTablesFromSql(sql) {
  const tables = new Set();
  const patterns = [
    /\bFROM\s+([A-Za-z0-9_.$"]+)/gi,
    /\bJOIN\s+([A-Za-z0-9_.$"]+)/gi,
    /\bINTO\s+([A-Za-z0-9_.$"]+)/gi,
    /\bUPDATE\s+([A-Za-z0-9_.$"]+)/gi,
  ];
  for (const re of patterns) {
    let m;
    while ((m = re.exec(sql))) {
      tables.add(m[1].replace(/"/g, ""));
    }
  }
  return [...tables];
}
