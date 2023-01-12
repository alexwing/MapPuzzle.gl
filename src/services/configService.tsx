
//global config class for the app
export class ConfigService {
  //REACT_APP_FOO
  public static backend:string = process.env.REACT_APP_FOO || "sqlite";
  public static langWikiSelector = false;
  public static cookieDays:number =   parseInt(process.env.REACT_APP_COOKIE_DAYS || "1");  
  public static editorEnabled:boolean = process.env.REACT_APP_EDITOR_ENABLED?.toLocaleLowerCase() === "true";
  public static backendUrl:string = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000/api";
  public static database:string = process.env.REACT_APP_DATABASE || "puzzles.sqlite3.png";
  public static defaultLang:string = process.env.REACT_APP_DEFAULT_LANG || "en";
  public static langs:string[] = process.env.REACT_APP_LANGS?.split(",") || ["en","es","fr"];
} 
