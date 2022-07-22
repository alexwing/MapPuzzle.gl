
//global config class for the app
export class ConfigService {
  public static cookieDays:number =   parseInt(process.env.REACT_APP_COOKIE_DAYS || "1");  
  public static editorEnabled:boolean = process.env.REACT_APP_EDITOR_ENABLED?.toLocaleLowerCase() === "true";
  public static backendUrl:string = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000/api/";

}
