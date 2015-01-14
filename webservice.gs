/**
* publishes control panel
* @param {Object} webservice parameters
* @return {HtmlOutput} html output
*/
function doGet(request) {
  if (request.parameters.hasOwnProperty("key")) {
    // check request secret
    if (request.parameters.key == GVAR.WEB_SERVICE_KEY) {
      return HtmlService
      .createTemplateFromFile("WebUi")
      .evaluate()
      .setTitle(GVAR.SCRIPT_NAME)
      .setSandboxMode(HtmlService.SandboxMode.NATIVE);
      //.setSandboxMode(HtmlService.SandboxMode.IFRAME);
    } else {
      return ContentService
      .createTextOutput("Unauthorized access!")
      .setMimeType(ContentService.MimeType.TEXT);
    }
  }
}
