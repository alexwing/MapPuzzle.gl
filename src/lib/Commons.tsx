//commons functions for the app front and back end

export function securizeQuery(sql: string): string {
  //disable sql injection
  if (
    sql.toUpperCase().includes("INSERT") ||
    sql.toUpperCase().includes("UPDATE") ||
    sql.toUpperCase().includes("DELETE") ||
    sql.toUpperCase().includes("DROP ")
  ) {
    throw new Error("SQL Injection detected");
  }
  return sql.replace(/;/g, "");
}

export function securizeTextParameter(text: string): string {
  //disable sql injection
  text = text.replace(/[';]/g, "");
  return text;
}
