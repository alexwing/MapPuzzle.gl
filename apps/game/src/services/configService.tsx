
//global config class for the app
export class ConfigService {
  //VITE_FOO
  public static backend:string = import.meta.env.VITE_FOO || "sqlite";
  public static langWikiSelector = false;
  public static cookieDays:number =   parseInt(import.meta.env.VITE_COOKIE_DAYS || "1");
  public static editorEnabled:boolean = import.meta.env.VITE_EDITOR_ENABLED?.toLocaleLowerCase() === "true";
  public static backendUrl:string = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api";
  public static database:string = import.meta.env.VITE_DATABASE || "puzzles.sqlite3.png";
  public static defaultLang:string = import.meta.env.VITE_DEFAULT_LANG || "en";
  public static langs:string[] = import.meta.env.VITE_LANGS?.split(",") || ["en","es","fr"];
  public static flagQuizBackgrounds = 20;
  public static flagQuizQuestions = 6;
  public static flagQuizTransitionsTime = 1500;
  public static flagQuizResponseTime = 1000;
  public static staleTime = import.meta.env.VITE_STALE_TIME == "Infinity" ? Infinity : parseInt(import.meta.env.VITE_STALE_TIME || "60000");
}
