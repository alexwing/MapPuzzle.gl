
//global config class for the app
export class ConfigService {
  public static cookieDays:number =   parseInt(process.env.REACT_APP_COOKIE_DAYS || "1");  
}
