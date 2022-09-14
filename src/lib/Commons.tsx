//commons functions for the app front and back end

export function securizeQuery(sql: string): string {
    //disable sql injection
    sql = sql.replace(/[';]/g, "");
    //detect INSERT UPDATE DELETE DROP
    if (sql.toUpperCase().includes("INSERT") || sql.toUpperCase().includes("UPDATE") || sql.toUpperCase().includes("DELETE") || sql.toUpperCase().includes("DROP ")) {
      throw new Error("SQL Injection detected");
    }
    return sql;
  }