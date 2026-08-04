// Backend utility functions

/**
 * Kept in sync with src/lib/Commons.tsx: a single statement, and it must be a
 * SELECT. The previous version matched INSERT/UPDATE/DELETE/DROP anywhere in
 * the string, so it also rejected those words inside string literals.
 */
export function securizeQuery(sql: string): string {
  const single = sql.replace(/;/g, "");
  if (!/^\s*SELECT\s/i.test(single)) {
    throw new Error("Only SELECT statements are allowed");
  }
  return single;
}

export function securizeTextParameter(text: string): string {
  //disable sql injection
  text = text.replace(/[';]/g, "");
  return text;
}
