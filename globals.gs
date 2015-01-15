function setGlobalVariableToScriptProperties() {
  var scriptProperties = PropertiesService.getScriptProperties();
  scriptProperties.setProperty("GVAR", JSON.stringify(GVAR));
}

function setDeleteAllScriptProperties() {
  var scriptProperties = PropertiesService.getScriptProperties().deleteAllProperties();
}

/**
* global variable object contains all global variables
* @type {Object}
* @const
*/
var GVAR = {
  // script name for various use
  "SCRIPT_NAME" : "Transfer Ownership", // used by frontend only

  // email address of the user for which the application is requesting delegated access
  "IMPERSONATED_USER_EMAIL" : "user_name.surname@domain.tld", // debug only
  
  // id of the drive object for debug and testing
  "IMPERSONATED_USER_DRIVE_OBJECT_ID" : "SOME_FILE_ID", // debug only
  
  // oauth scopes separated by space as in https://developers.google.com/drive/web/scopes for drive
  // needs full access to all files in the user's drive
  "SCOPES_SPACE_SEPARATED" : "https://www.googleapis.com/auth/drive", // change for production
  
  // service account email address generated from google developer console > apis & auth > credentials > oauth > create new client id > service account
  "SERVICE_ACCOUNT_EMAIL" : "service_account_email@developer.gserviceaccount.com", // change for production

  // service account p12 key generated from google developer console > apis & auth > credentials > oauth > create new client id > service account
  // transformed to base64 pem via "openssl pkcs12 -in ~/certfilename.p12 -nodes | openssl rsa | base64 > ~/certfilename.pem.b64"
  "GOOGLE_DEV_CONSOLE_OAUTH_P12_BASE64" : "THIS_IS_JUST_TEMPLATE_fg4897gf98457gf984g7f8947gf984g75f8947g5f98475gf98475gf89347g5f893475gf98347gf93487gf8945gf73489gf74875fg984f7g9483gf89437gf98347gf8934gf798457gf8947gf9347gf89347gf8947g5f98743g5f89743g5f8934g75f897g4895fg734985f7g34895fgf93475gf49f7g94835gf4985f7g845gf48957gf4985gf7f49385gf794857gf4943758fg9345fg48975gf948375gf49857gf8347g5f934875gf4897g5f84957gf475gf894357gf89435gf49875gf48975gf4785gf938457gf934875gf934875gf8437g5f94785fg8934gf89437gf934857gf89437gf89473g5f9847g5f894375gf89475gf894375gf8947g5f8947gf83475gf983475gf893475gf8934f89437g5f893475gf98347g5f98437gf589437g5f89347g5f8947g5f8947g5f89437g5f9834gf89473gf89347g5f8934g7589f7g49875gf89347gf89437g5f9847gf589437g5f89734gf89734g985gf73489gf98347gf8943gf89475gf834g5f87g34985f7g43897gf89347gf89345gf8574gf983475gf98347f5g8934g7f8934gf89347g5f89347g5f98347g5f89473g5f89734g5f98g34589f7g4589f7g98457gf98347g5f89347gf893475gf89347gf89347g5ff34f7y94837yf89347yf98437y5f8734y5f89473y9f83y4895f7y34987yf8347y5f98347yf98347yf98347y5f8974y35f89y3498f7y893475yf98347yf893457yf984375yf98347y5f98743y59f87y4398fy34895f7y98457yf893457y98f7y345985f7y89347yf89347y598fy3498f7y34897y5f893477fyf98_THIS_IS_JUST_TEMPLATE=", // change for production
  
  // script url id
  "SCRIPT_URL_ID" : "14t54yXwWL92IellyMjwhJtRgqPIznFn4q18XmLFWkPq-638cKaVkNn_6", // change for production
  
  // script project key
  "SCRIPT_PROJECT_KEY" : "OfYRv8X9K-VuJTzw32qfU0xkPvQ8bevdh", // change for productions
  
  // script web service key
  "WEB_SERVICE_KEY" : "C4A4E45C877B17AA97CCC642D98C406B", // change for production
  
  // email address of the user to whom transfer ownership
  "TRANSFER_OWNERSHIP_TO" : "admin_name.surname@domain.tld", // change for production
  
  // domain of google apps to work with
  "DOMAIN_OF_GOOGLE_APPS" : "domain.tld", // change for production
  
  // dir scan cache file lifetime in hours
  "CACHE_FILE_LIFETIME" : 96, // change for production
  
  // root folder id for ownership transfer
  "ROOT_FOLDER_ID" : "SOME_FOLDER_ID", // change for production
  
  // cache folder id to store script data as cache
  "CACHE_FOLDER_ID" : "SOME_FOLDER_ID", // change for production
  
  // log file id
  "LOG_FILE_ID" : "SOME_FILE_ID" // change for production
  
  // mail ui file name
  "MAIL_UI_FILENAME" : "mailui.html", // change for production
  
  // webservice ui file name
  "WEBSERVICE_UI_FILENAME" : "webui.html" // change for production
};
