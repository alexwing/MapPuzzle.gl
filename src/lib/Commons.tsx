//commons functions for the app front and back end

/**
 * Client-side sanity check, mirroring the rule the PHP endpoint enforces: a
 * single statement, and it must be a SELECT.
 *
 * It used to look for INSERT/UPDATE/DELETE/DROP anywhere in the string, which
 * also matched string literals: searching the puzzle list for "update" or
 * "delete" threw here and the UI silently showed no results. Checking the
 * leading keyword is both stricter and free of false positives.
 *
 * This is only a guard against our own mistakes — anything reaching the server
 * is validated there, since a client check is trivially bypassed.
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
