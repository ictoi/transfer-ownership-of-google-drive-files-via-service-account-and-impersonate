/**
* sends transactional email
*
* @param {String} recipientEmailAddress recipient email address
* @param {String} mailVariablesObj mail variables object
* @requires MailUi.html file
* @returns {Bool} success
*/
function setSendTransactionalEmail(recipientEmailAddress, mailVariablesObj){
  recipientEmailAddress = (recipientEmailAddress || GVAR.TRANSFER_OWNERSHIP_TO);
  // #2baf2b = Green 400, #738ffe = Blue 400, #ffb300 = Amber 600, #ff7043 = Deep Orange 400; always use black text - see http://www.google.com/design/spec/style/color.html#color-ui-color-palette
  mailVariablesObj = (mailVariablesObj || {
                      "~backgroundColor~" : "#ff7043", // #ff7043 = Deep Orange 400
                      "~titleText~" : "Fatal error",
                      "~headerMessage~" : "Fatal error",
                      "~mainMessage~" : "Fatal error",
                      "~buttonText~" : "Contact your administrator.",
                      "~buttonUrl~" : "https://drive.google.com/",
                      "~footerText~" : "Do not reply to this email."
                      });
  // get html temlpate
  var aVar = null, htmlBody = null, plainBody = "";  
  var htmlBody = HtmlService.createHtmlOutputFromFile("MailUi.html").getContent();
  // get all email variables and replace with data values
  var mailVariables = htmlBody.match(/([~])(?:(?=(\\?))\2.)*?\1/g);
  if (mailVariables !== null) {
    for (var i = 0, lenI = mailVariables.length; i < lenI; i++) {
      htmlBody = htmlBody.replace(mailVariables[i], mailVariablesObj[mailVariables[i]]);
      plainBody = htmlBody.replace(mailVariables[i], mailVariablesObj[mailVariables[i]]);
    }
  }
  // send email
  var gmailAppObj = GmailApp.sendEmail(recipientEmailAddress,
                                       mailVariablesObj["~titleText~"],
                                       plainBody, {
                                         htmlBody : htmlBody,
                                         //bcc: "name.surname@domain.tld", // debug only
                                         noReply : true});
  return true;
}

/**
* gets total number of files shared to account
*
* @returns {Number} file count
*/
function getUserSharedFileCount(ownerEmail) {
  //ownerEmail = (ownerEmail || "name.surname@domain.tld"); // debug only
  var fileIterator = null, file = null, i = 0, startTime = new Date();
  fileIterator = DriveApp.searchFiles("trashed != true and not ('" + GVAR.TRANSFER_OWNERSHIP_TO + "' in owners) and '" + ownerEmail + "' in owners");
  /*fileIterator = DriveApp.searchFiles("trashed != true and not ('" + GVAR.TRANSFER_OWNERSHIP_TO + "' in owners) and '" + ownerEmail + "' in owners " +
  "and " + "(" +
  "mimeType = 'application/vnd.google-apps.document'"
  + " or " +
  "mimeType = 'application/vnd.google-apps.drawing'"
  + " or " +
  "mimeType = 'application/vnd.google-apps.forms'"
  + " or " +
  "mimeType = 'application/vnd.google-apps.fusiontable'"
  + " or " +
  "mimeType = 'application/vnd.google-apps.presentation'"
  + " or " +
  "mimeType = 'application/vnd.google-apps.script'"
  + " or " +
  "mimeType = 'application/vnd.google-apps.sites'"
  + " or " +
  "mimeType = 'application/vnd.google-apps.spreadsheet'"
  + ")"
  ); // free domains only*/
  while (fileIterator.hasNext()) {
    file = fileIterator.next();
    i++;
  }
  var elapsedTime = countdown(startTime, new Date(), countdown.DEFAULTS).toString();
  // prepare email variables and send transactional email
  var mailVariablesObj = {
    "~backgroundColor~" : "#738ffe", // #738ffe = Blue 400
    "~titleText~" : "File count " + ownerEmail + " " + i + " in " + elapsedTime,
    "~headerMessage~" : "File count " + ownerEmail + " " + i + " in " + elapsedTime,
    "~mainMessage~" : "File count " + ownerEmail + " " + i + " in " + elapsedTime,
    "~buttonText~" : "Stay relaxed",
    "~buttonUrl~" : "https://drive.google.com/",
    "~footerText~" : "Do not reply to this email."
  };
  var mailSendResult = setSendTransactionalEmail(GVAR.TRANSFER_OWNERSHIP_TO, mailVariablesObj);
  return i;
}

/**
* gets all drive object (file / folder) ancestors and results in true if root folder is ancestor
* @param {File|Folder} driveObj drive object id (file, folder)
* @param {Array} fillArray array to fill with ancestors
* @param {Number} iterLevel current iteration level
* @returns {Bool|Null} true if root folder found in ancestors | null if not present
*/
function getFileHasAncestor(driveObj, fillArray, iterLevel){
  // process all parents
  var parentIter = driveObj.getParents();
  while (parentIter.hasNext()) {
    var parentFolder = parentIter.next();
    var parentFolderId = parentFolder.getId();
    fillArray.push([parentFolderId, iterLevel]);
    // drive object has root folder in ancestors
    if (parentFolderId === GVAR.ROOT_FOLDER_ID) {return true};
    // recursive call
    if (getFileHasAncestor(parentFolder, fillArray, iterLevel)) {return true};
  }
}

/**
* gets cache file id from script properties or settles new cache file and writes to script properties
* @param {Bool} settleNewCacheFile switch to settle new cache file
* @param {String} cacheFilePurpose cache file purpose switch
* @returns {String} cache file id
*/
function getCacheFileId(settleNewCacheFile, cacheFilePurpose) {
  // defaults
  if (arguments.length === 0) {settleNewCacheFile = true, cacheFilePurpose = "dirScan"};
  // catch exception
  try {
    // set variables
    var cacheFileId = null;
    // prepopulate folder object with root folder
    var scriptProperties = PropertiesService.getScriptProperties();
    //scriptProperties.deleteProperty("cacheFileId"); // debug only
    if (scriptProperties.getProperty("cacheFileId" + "_" + cacheFilePurpose) !== null && settleNewCacheFile === false) {
      cacheFileId = scriptProperties.getProperty("cacheFileId" + "_" + cacheFilePurpose);
    } else {
      var cacheFileName = "cache_" + Utilities.formatDate((new Date()), "Europe/Prague", "yyyy-MM-dd'T'HH:mm:ss.SSSXXX")  + "_" + cacheFilePurpose + ".json";
      cacheFileId = DriveApp.getFolderById(GVAR.CACHE_FOLDER_ID).createFile(cacheFileName, "", MimeType.JSON).getId();
      scriptProperties.setProperty("cacheFileId" + "_" + cacheFilePurpose, cacheFileId);
    }
  } catch(e) {
    Logger.log(e);
    //Flog(e);
    throw new Error("Oops! Can not get cache file or read from cache.");
  }
  // get folder structure file list
  return cacheFileId;
}

/**
* cleans cache file
* @requires getCacheFileId
* @returns {Bool} success
*/
function setCleanCacheFile(cacheFilePurpose) {
  //var cacheFilePurpose = "dirScan";
  var cacheFilePurpose = "transResult";
  var cacheFileId = getCacheFileId(false, cacheFilePurpose);
  var fileCache = null;
  fileCache = DriveApp.getFileById(cacheFileId);
  fileCache.setContent("");
  return true;
}

/**
* deletes all project triggers of given handler function
* @param {String} handlerFunction name of the handler function to be deleted
* @returns {Bool} success
*/
function setDeleteAllTriggersOfHandlerFunction(handlerFunction) {
  var allTriggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < allTriggers.length; i++) {
    if (allTriggers[i].getHandlerFunction() === handlerFunction) {
      ScriptApp.deleteTrigger(allTriggers[i]);
    }
  }
  return true;
}

/**
* deletes trigger by its id
* @returns {String} triggerId id of the trigger to be deleted
* @returns {Bool} success
*/
function setDeleteTriggerById(triggerId) {
  var allTriggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < allTriggers.length; i++) {
    if (allTriggers[i].getUniqueId() == triggerId) {
      ScriptApp.deleteTrigger(allTriggers[i]);
      break;
    }
  }
  return true;
}

/**
* deletes all project triggers
* @returns {Bool} success
*/
function setDeleteAllTriggers(){
  var allTriggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < allTriggers.length; i++) {
    ScriptApp.deleteTrigger(allTriggers[i]);
  }
  return true;
}

/**
* gets all domain user emails via admin sdk directory api
* @requires advanced google services Admin Directory API to be allowed and enabled in developer console
* @returns {Array} usersArray array of all domain users
*/
function getAllDomainUsersEmail() {
  var pageToken, page, usersArray = [];
  do {
    //https://developers.google.com/admin-sdk/directory/v1/reference/users/list
    page = AdminDirectory.Users.list({
      domain: GVAR.DOMAIN_OF_GOOGLE_APPS,
      orderBy: "email",
      maxResults: 500,
      pageToken: pageToken
    });
    var users = page.users;
    if (users) {
      for (var i = 0, lenI = users.length; i < lenI; i++) {
        var user = users[i];
        usersArray.push(user.primaryEmail);
      }
    } else {
      Logger.log("No users found.");
      return [];
    }
    pageToken = page.nextPageToken;
  } while (pageToken);
  return usersArray;
}

/**
* returns all triggers as array
* @returns {Array} triggerArray user trigger array
*/
function getScriptTriggersArray() {
  var allTriggers = ScriptApp.getProjectTriggers();
  var triggerArray = [];
  for (var i = 0; i < allTriggers.length; i++) {
    triggerArray.push(
      "Type: " + allTriggers[i].getEventType()
    + "; function: " + allTriggers[i].getHandlerFunction()
    + "; source: " + allTriggers[i].getTriggerSource()
    + "; id: " +  allTriggers[i].getUniqueId()
    )
  }
  return triggerArray;
}

/**
* logs message to log file
* @returns {Bool} success
*/
function Flog(logMessage, initFile){
  logMessage = (logMessage || new Date());
  var logFile = null, logFileTxt = null;
  logFile = DriveApp.getFileById(GVAR.LOG_FILE_ID);
  if (initFile) {
    logFile.setContent("Begin log file.");
    return true;
  }
  logFileTxt = logFile.getBlob().getDataAsString();
  logFileTxt = Utilities.formatDate((new Date()), "Europe/Prague", "yyyy-MM-dd'T'HH:mm:ss.SSSXXX") + " : " + logMessage + "\n" + logFileTxt;
  logFile.setContent(logFileTxt);
  return true;
}

/**
* returns flog as array
* @returns {Array} logArray user log array
*/
function getFlog() {
  var logFile = null, logFileTxt = null;
  logFile = DriveApp.getFileById(GVAR.LOG_FILE_ID);
  logFileTxt = logFile.getBlob().getDataAsString();
  var logArray = logFileTxt.split("\n");
  return logArray;
}
