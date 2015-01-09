function setTransferOwnership() {
  // catch exception
  try {
    setDeleteAllTriggersOfHandlerFunction("setTransferOwnership");
  } catch(e) {
    Flog("Can not delete triggers!" + e);
    return false;
  }
  // catch exception
  try {
    Flog("Getting cache files.");
    var startTime = new Date(), cacheWriteChunkSize = 20;
    // get data from cache or init cache with all domain users
    var cacheFileId = getCacheFileId(false, "dirScan");
    var resultFileId = getCacheFileId(false, "transResult");
    var fileCache = null, fileCacheTxt = null, fileResult = null, fileResultTxt = null; 
    fileCache = DriveApp.getFileById(cacheFileId), fileResult = DriveApp.getFileById(resultFileId);
    fileCacheTxt = fileCache.getBlob().getDataAsString(), fileResultTxt = fileResult.getBlob().getDataAsString(); // FILE CACHE READ & FILE RESULT READ
    Flog("Getting cache files. Done!");
  } catch(e) {
    Flog("Can not get cache files! " + e);
    return false;
  }
  // catch exception
  try {
    Flog("Parsing cache files.");
    var inObj = {}, outObj = {};
    if (fileCacheTxt != "") {
      inObj = JSON.parse(fileCacheTxt);
    } else {
      // blank cache file means terminate
      Flog("Blank cache file. Run 'Scan dir to cache file' function first!");
      throw new Error("Blank cache file. Run scan dir first!"); // ERROR
    }
    //fileResult.setContent(""); // debug only
    if (fileResultTxt === "") {
      outObj["domainUsers"] = {};
    }
    if (fileResultTxt !== "") {
      outObj = JSON.parse(fileResultTxt);
    }
    Flog("Parsing cache files. Done!");
  } catch(e) {
    Flog("Can not parse cache files! " + e);
    return false;
  }
  // catch exception
  try {
    Flog("Work objects init.");
    var cUserId = null, cUserObj = null, cUserFilesArr = [], doneFiles = [], todoFiles = [];
    for (cUserId in inObj["domainUsers"]){
      if (inObj["domainUsers"][cUserId]["queryComplete"] === true && inObj["domainUsers"][cUserId]["userFiles"].length === 0) {
        //Flog("No files for owner " + cUserId + ". Continue!");
        continue;
      }
      Flog("Set user " + cUserId + ".");
      if (inObj["domainUsers"][cUserId]["queryComplete"] === true && inObj["domainUsers"][cUserId]["userFiles"].length !== 0) {
        if (typeof outObj["domainUsers"][cUserId] === "undefined") {
          outObj["domainUsers"][cUserId] = {
            "ownerComplete" : false,
            "todoFiles" : inObj["domainUsers"][cUserId]["userFiles"],
            "doneFiles" : []
          };
          Flog("Set user " + cUserId + ". Done!");
          break;
        }
        if (outObj["domainUsers"][cUserId]["ownerComplete"] === true) {
          Flog("Owner complete " + cUserId + ". Continue!");
          continue;
        }
        if (outObj["domainUsers"][cUserId]["ownerComplete"] !== true) {
          doneFiles = outObj["domainUsers"][cUserId]["doneFiles"];
          break;      
        }
        Flog("All users done. Success!");
        return true; // RETURN
      }
      Flog("All users done. Success!");
      return true; // RETURN
    }
    Flog("Work objects init. Done!");
  } catch(e) {
    Flog("Can not set files to parse! " + e);
    return false;
  }
  // catch exception
  try {
    // get impersonated token and transfer ownership
    //Flog(JSON.stringify(outObj["domainUsers"][cUserId])); // debug only
    todoFiles = outObj["domainUsers"][cUserId]["todoFiles"];
    var lenI = outObj["domainUsers"][cUserId]["todoFiles"].length;
    Flog("Begin loop for " + cUserId + " length " + lenI + ".");
    for (var i = 0; i < lenI; i++) {
      ///Flog("Count: " + i); // debug only
      //Utilities.sleep(1000); // debug only
      if (todoFiles[i] === undefined) {break};
      try {
        var impResult = setImpersonatedOwnership(todoFiles[i], cUserId, GVAR.TRANSFER_OWNERSHIP_TO);
      } catch(e) {
        Flog("Can not transfer ownership for actual file!");
      }
      try {
        DriveApp.removeFile(DriveApp.getFileById(todoFiles[i]));
      } catch(e) {
        Flog("Can not remove file from the root folder!");
      }
      //var impResult = true; // debug only
      if (impResult) {
        var cItem = todoFiles.shift();
        doneFiles.push(cItem);
        outObj["domainUsers"][cUserId]["doneFiles"] = doneFiles;
        outObj["domainUsers"][cUserId]["todoFiles"] = todoFiles;
      } else {
        Flog("Error while transferring ownership of object id: " + todoFiles[i] + "!");
        break;
        return false;
      }
      var timeElapsed = countdown(startTime, new Date(), countdown.DEFAULTS);
      var timeElapsedValue = timeElapsed.value;
      if (timeElapsedValue >= 242000) { // 4.04 minutes; 6 minutes max. but 5 minutes trigger run interval
        // set continuation trigger
        var contTrigger = ScriptApp.newTrigger("setTransferOwnership").timeBased().everyMinutes(1).create();
        //var contTriggerId = contTrigger.getUniqueId();
        //outObj["domainUsers"][cUserId]["contTriggerId"] = contTriggerId;
        fileResult = fileResult.setContent(JSON.stringify(outObj)); // FILE CACHE WRITE
        Flog("Timeout trigger set. Script will continue!");
        //throw new Error("Timeout");
        return false; // RETURN
      }
      // save in chunks
      if (i % cacheWriteChunkSize === 0 && i > 0) {
        fileResult = fileResult.setContent(JSON.stringify(outObj)); // FILE CACHE WRITE
        var timeElapsedHuman = timeElapsed.toString();
        Flog("Chunk " + i + " in " + timeElapsedHuman + ".  Done " + doneFiles.length + "; remains " + todoFiles.length + ".");
      }
    }
  } catch(e) {
    Flog("Can not loop files! " + e);
    return false;
  }
  Flog("Transfer loop. Done!");
  outObj["domainUsers"][cUserId]["ownerComplete"] = true;
  fileResult = fileResult.setContent(JSON.stringify(outObj));
  Flog("Chunk " + i + "." + " Done " + doneFiles.length + "; remains " + todoFiles.length + ".");
  // recursive call
  setTransferOwnership();
  //return true;
  // set continuation trigger
  /*var contTrigger = ScriptApp.newTrigger("setImpersonatedOwnershipDirScan").timeBased().everyMinutes(5).create();
  var contTriggerId = contTrigger.getUniqueId();
  outObj["contTriggerId"] = contTriggerId;
  fileResult = fileResult.setContent(JSON.stringify(outObj));*/
}

function setDirScanToCacheFile() {
  // catch exception
  try {
    setDeleteAllTriggersOfHandlerFunction("setDirScanToCacheFile");
  } catch(e) {
    Flog("Can not delete triggers!" + e);
  }
  var startTime = new Date();
  // catch exception
  try {
    // get data from cache or init cache with all domain users
    Flog("Get and parse cache file.");
    var cacheFileId = getCacheFileId(false, "dirScan");
    var fileCache = null, fileCacheTxt = null, loopCount = 0; 
    fileCache = DriveApp.getFileById(cacheFileId);
    //fileCache.setContent(""); // debug only
    fileCacheTxt = fileCache.getBlob().getDataAsString(); // FILE CACHE READ
    var masterObj = {};
    if (fileCacheTxt != "") {
      masterObj = JSON.parse(fileCacheTxt);
    } else {
      // get all domain users
      var allDomainUsersEmail = getAllDomainUsersEmail();
      masterObj = {"domainUserList" : allDomainUsersEmail, "domainUsers" : {}};
      fileCache = fileCache.setContent(JSON.stringify(masterObj)); // FILE CACHE WRITE
    }
    Flog("Get and parse cache file. Done!");
  } catch (e) {
    Flog("Can not get domain users or parse cache file!");
    return false;
  }
  // loop all users and generate file list
  Flog(masterObj["domainUserList"]);
  if (typeof masterObj["domainUserList"] !== "undefined" && masterObj["domainUserList"].length > 0) {
    for (var i = 0, lenI = masterObj["domainUserList"].length; i < lenI; i++) {
      if (typeof masterObj["domainUsers"][masterObj["domainUserList"][i]] !== "undefined"
          && masterObj["domainUsers"][masterObj["domainUserList"][i]]["queryComplete"] === true) {
        Flog(masterObj["domainUserList"][i] + " item " + i + " of " + lenI + ". Done!"); // debug only
        continue;
      };
      Flog("Starting item " + i + " of " + lenI + ". Done!");
      //var actionResult = setAllOwnerFilesCacheFile("jan.hus@ictoi.com", false, cacheFileId, startTime, 20, GVAR.CACHE_FILE_LIFETIME); // debug only
      //var actionResult = setAllOwnerFilesCacheFile(masterObj["domainUserList"][i], false, cacheFileId, startTime, 20, GVAR.CACHE_FILE_LIFETIME); // debug only
      var actionResult = setAllOwnerFilesCacheFile(masterObj["domainUserList"][i], false, cacheFileId, startTime, 25, GVAR.CACHE_FILE_LIFETIME); // debug only
      //var actionResult = setAllOwnerFilesCacheFile(masterObj["domainUserList"][i], false, cacheFileId, startTime, 30, GVAR.CACHE_FILE_LIFETIME); // debug only
      //var actionResult = setAllOwnerFilesCacheFile(masterObj["domainUserList"][i], false, cacheFileId, startTime, 40, GVAR.CACHE_FILE_LIFETIME); // debug only
      //var actionResult = setAllOwnerFilesCacheFile(masterObj["domainUserList"][i], false, cacheFileId, startTime, 2, GVAR.CACHE_FILE_LIFETIME); // debug only
      if (!actionResult) {
        Flog("Action result is false. Error!");
        return false
      };
    }
  }
  Flog("Scan dir for all owners completed successfully. Done!");
  // prepare email variables and send transactional email
  var mailVariablesObj = {
    "~backgroundColor~" : "#738ffe", // #738ffe = Blue 400
    "~titleText~" : "Scan dir for all owners completed successfully",
    "~headerMessage~" : "Scan dir for all owners completed successfully",
    "~mainMessage~" : "Scan dir for ownership transfer completed successfully for all owners.",
    "~buttonText~" : "See generated cache file",
    "~buttonUrl~" : "https://drive.google.com/open?id=" + cacheFileId + "&authuser=0",
    "~footerText~" : "Do not reply to this email."
  };
  var mailSendResult = setSendTransactionalEmail(GVAR.TRANSFER_OWNERSHIP_TO, mailVariablesObj);
}

function setAllOwnerFilesCacheFile(ownerEmail, returnNegatives, cacheFileId, startTime, cacheWriteChunkSize, queryLifeTimeHours) {
  Flog("File init for " + ownerEmail + ".");
  // catch exception
  try {
    // get lock
    var userLock = LockService.getUserLock();
    userLock.waitLock(10000);
    if (!userLock.hasLock()) {
      Flog("Can not run second instance of the script.");
      //throw new Error("Can not run second instance of the script."); // ERROR
      return false; // RETURN
    };
  } catch(e) {
    Flog("Can not get user lock! " + e);
    return false;
  }
  // catch exception
  try {
    // init cache
    //Flog("Get and parse cache file.");
    var fileCache = null, fileCacheTxt = null, loopCount = 0, cLifeTime = null; 
    fileCache = DriveApp.getFileById(cacheFileId);
    //fileCache.setContent(""); // debug only
    fileCacheTxt = fileCache.getBlob().getDataAsString(); // FILE CACHE READ
    var masterObj = {};
    // check cache file blank and parse 
    if (fileCacheTxt != "") {
      masterObj = JSON.parse(fileCacheTxt);
    }
    //Flog("Get and parse cache file. Done!");
  } catch(e) {
    Flog("Can not get and parse cache file! " + e);
    return false;
  }
  Flog("File init for " + ownerEmail + ". Done!");
  // catch exception
  try {
    // init domain users node
    Flog("Check tasks for " + ownerEmail + "!");
    if (typeof masterObj["domainUsers"] === "undefined") {masterObj["domainUsers"] = {}};
    if (typeof masterObj["domainUsers"][ownerEmail] !== "undefined") {
      // do not run query if already completed and lifetime is not reached
      cLifeTime = Math.abs(new Date(masterObj["domainUsers"][ownerEmail]["queryFirstInitTime"]) - startTime) / 36e5;
      if (masterObj["domainUsers"][ownerEmail]["queryComplete"] === true && (cLifeTime < queryLifeTimeHours)) {
        Flog("Query complete. Done!");
        setDeleteTriggerById(masterObj["domainUsers"][ownerEmail]["contTriggerId"]);
        // release lock
        userLock.releaseLock();
        return true; // RETURN
      }
      if (masterObj["domainUsers"][ownerEmail]["queryComplete"] === true && (cLifeTime >= queryLifeTimeHours)) {
        masterObj["domainUsers"][ownerEmail] = undefined, fileCacheTxt = "";
      }
      Flog("Check tasks. Done!");
    }
    // check cache file not blank or domain users node present or owner email node not present
    if (fileCacheTxt == "" || typeof masterObj["domainUsers"][ownerEmail] === "undefined") {
      Flog("Init user object.");
      var filesOwnedByUser = null, contTokenObj = {};
      // init master object for non cached run or if new owner passed
      masterObj["domainUsers"][ownerEmail] = {
        "queryComplete" : false,
        "queryFirstInitTime" : new Date(),
        "queryEndSuccessTime" : null,
        "queryElapsedTime" : null,
        "filesAlreadyCached" : 0, // debug only
        "chunksDone" : [], // debug only
        //"lastChunkEndTime" : null, // debug only
        //"lastChunkElapsedTime" : null,
        "resumedRunCount" : 0,
        "contToken" : null,
        //"previousContToken" : null, // debug only
        "contTokenCreationTime" : null,
        "contTriggerId" : null,
        "impToken" : null,
        "userFiles" : []
      }
      //fileCache = fileCache.setContent(JSON.stringify(masterObj)); // FILE CACHE WRITE
      Flog("Init user object. Done!");
    }
  } catch(e) {
    Flog("Can not get and parse cache file! " + e);
    return false;
  }
  // catch exception
  try {
    // get tokens for iterators
    Flog("Run query.");
    var userFilesIter = null, queryFirstInitTime = null;
    var contTokenLifeTime = Math.abs(new Date(masterObj["domainUsers"][ownerEmail]["contTokenCreationTime"]) - startTime) / 36e5;
    if (masterObj["domainUsers"][ownerEmail]["contToken"] === null || contTokenLifeTime >= 24) {
      userFilesIter = DriveApp.searchFiles("trashed != true and not ('" + GVAR.TRANSFER_OWNERSHIP_TO + "' in owners) and '" + ownerEmail + "' in owners");
      /*userFilesIter = DriveApp.searchFiles("trashed != true and not ('" + GVAR.TRANSFER_OWNERSHIP_TO + "' in owners) and '" + ownerEmail + "' in owners " +
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
      queryFirstInitTime = new Date();
    } else {
      userFilesIter = DriveApp.continueFileIterator(masterObj["domainUsers"][ownerEmail]["contToken"]);
      // delete continuation trigger
      setDeleteTriggerById(masterObj["domainUsers"][ownerEmail]["contTriggerId"]);
      queryFirstInitTime = masterObj["domainUsers"][ownerEmail]["queryFirstInitTime"];
    }
    Flog("Run query. Done!");
  } catch(e) {
    Flog("Can not initiate or call query! " + e);
    return false;
  }
  // catch exception
  try {
    Flog("Loop objects.");
    while (userFilesIter.hasNext()) {
      // init vars
      var fileObj = null, fileId = null, fileName = null;
      loopCount++;
      masterObj["domainUsers"][ownerEmail]["filesAlreadyCached"]++;
      // iterate next
      var fileObj = userFilesIter.next()
      // get file basic info
      fileId = fileObj.getId()
      //fileName = fileObj.getName();
      var ancResult = false, fillArray = [], iterLevel = 0, ancArray = null, timeElapsed = null;
      // get all drive object ancestors
      //var timerA = new Date(); // debug only
      ancResult = getFileHasAncestor(fileObj, fillArray, iterLevel);
      //if (loopCount % cacheWriteChunkSize === 0) {Flog("Get ancestors" + "; count: " + loopCount + "; subtime elapsed: " + countdown(timerA, new Date(), countdown.DEFAULTS).toString())}; // debug only
      //if (ancResult) {ancArray = fillArray} // debug only
      fillArray = null; // null result array
      // fill master object with search data
      //masterObj["domainUsers"][ownerEmail]["userFiles"].push([fileId, fileName, ancResult, ancArray]); // debug only
      if (ancResult || (returnNegatives && ancResult === null)) {
        //masterObj["domainUsers"][ownerEmail]["userFiles"].push([fileId, fileName, ancResult]); // debug only
        masterObj["domainUsers"][ownerEmail]["userFiles"].push(fileId);
      }
      //Utilities.sleep(4000); // debug only
      // run in chunks
      timeElapsed = countdown(startTime, new Date(), countdown.DEFAULTS).value;
      if (loopCount % cacheWriteChunkSize === 0) {
        // first run or first continuation run
        if (loopCount / cacheWriteChunkSize === 1) {masterObj["domainUsers"][ownerEmail]["queryFirstInitTime"] = queryFirstInitTime};
        var timeElapsedHuman = countdown(startTime, new Date(), countdown.DEFAULTS).toString();
        //masterObj["domainUsers"][ownerEmail]["chunksDone"].push([loopCount, timeElapsed, timeElapsedHuman]); // debug only
        masterObj["domainUsers"][ownerEmail]["chunksDone"].push([loopCount, timeElapsed]); // debug only
        fileCache = fileCache.setContent(JSON.stringify(masterObj)); // FILE CACHE WRITE
        Flog("Chunk " + loopCount + " done in " + timeElapsedHuman);
        // cont token and previous cont token equal means failure
        /*if (masterObj["domainUsers"][ownerEmail]["filesAlreadyCached"] > 10000) {
          // prepare email variables and send transactional email
          var mailVariablesObj = {
            "~backgroundColor~" : "#ff7043", // #ff7043 = Deep Orange 400
            "~titleText~" : "Scan dir for " + ownerEmail + " exceeded limit file count",
            "~headerMessage~" : "Scan dir for " + ownerEmail + " exceeded limit file count",
            "~mainMessage~" : "This results in fatal error that may lead to infinite loop. If you see this email, contact your administrator!",
            "~buttonText~" : "See generated cache file",
            "~buttonUrl~" : "https://drive.google.com/open?id=" + cacheFileId + "&authuser=0",
            "~footerText~" : "Do not reply to this email."
          };
          var mailSendResult = setSendTransactionalEmail(GVAR.TRANSFER_OWNERSHIP_TO, mailVariablesObj);
          var deleteResult = setDeleteAllTriggersOfHandlerFunction("setAllOwnerFilesCacheFile");
          return false;
          break;
        };*/
      }
      // check max script time run and terminate with continuation token cache write
      //if (timeElapsed >= 270000) { // 4.5 minutes; 6 minutes max. but 5 minutes trigger run interval
      if (timeElapsed >= 252000) { // 4.2 minutes; 6 minutes max. but 5 minutes trigger run interval
      //if (timeElapsed >= 242000) { // 4.04 minutes; 6 minutes max. but 5 minutes trigger run interval
        //if (timeElapsed >= 235000) { // 3.92 minutes; 6 minutes max. but 5 minutes trigger run interval
        //masterObj["domainUsers"][ownerEmail]["previousContToken"] = masterObj["domainUsers"][ownerEmail]["contToken"];
        var contToken = userFilesIter.getContinuationToken();
        masterObj["domainUsers"][ownerEmail]["contToken"] = contToken;
        masterObj["domainUsers"][ownerEmail]["contTokenCreationTime"] = new Date();
        masterObj["domainUsers"][ownerEmail]["resumedRunCount"]++;
        //masterObj["domainUsers"][ownerEmail]["filesAlreadyCached"] = loopCount;
        // set continuation trigger
        var contTrigger = ScriptApp.newTrigger("setDirScanToCacheFile").timeBased().everyMinutes(1).create();
        var contTriggerId = contTrigger.getUniqueId();
        masterObj["domainUsers"][ownerEmail]["contTriggerId"] = contTriggerId;
        masterObj["domainUsers"][ownerEmail]["chunksDone"].push([masterObj["domainUsers"][ownerEmail]["contToken"], masterObj["domainUsers"][ownerEmail]["contTokenCreationTime"], cLifeTime]); // debug only
        fileCache = fileCache.setContent(JSON.stringify(masterObj)); // FILE CACHE WRITE
        Flog("Timeout trigger set. Script will continue!");
        // release lock
        userLock.releaseLock();
        //throw new Error("Loop timeout but resume trigger has been set."); // ERROR
        return false; // RETURN
      }
    }
    Flog("Loop objects. Done!");
  } catch(e) {
    Flog("Can not loop objects! " + e);
    return false;
  }
  Flog("Finalize user section and inform.");
  masterObj["domainUsers"][ownerEmail]["contTriggerId"] = null;
  masterObj["domainUsers"][ownerEmail]["contToken"] = null;
  masterObj["domainUsers"][ownerEmail]["contTokenCreationTime"] = null;
  masterObj["domainUsers"][ownerEmail]["queryComplete"] = true;
  masterObj["domainUsers"][ownerEmail]["queryEndSuccessTime"] = new Date();
  masterObj["domainUsers"][ownerEmail]["queryElapsedTime"] = countdown(new Date(masterObj["domainUsers"][ownerEmail]["queryFirstInitTime"]), masterObj["domainUsers"][ownerEmail]["queryEndSuccessTime"], countdown.DEFAULTS).toString();
  //masterObj["domainUsers"][ownerEmail]["lastChunkElapsedTime"] = countdown(new Date(masterObj["domainUsers"][ownerEmail]["lastChunkEndTime"]), new Date(), countdown.DEFAULTS).toString(); // debug only
  fileCache = fileCache.setContent(JSON.stringify(masterObj)); // FILE CACHE WRITE
  // prepare email variables and send transactional email
  var mailVariablesObj = {
    "~backgroundColor~" : "#ffb300", // #ffb300 = Amber 600
    "~titleText~" : "Scan dir for " + ownerEmail + " completed successfully",
    "~headerMessage~" : "Scan dir for " + ownerEmail + " completed successfully",
    "~mainMessage~" : "Scan dir for ownership transfer completed successfully in " + masterObj["domainUsers"][ownerEmail]["queryElapsedTime"] + " for actual owner " + ownerEmail + " with " + masterObj["domainUsers"][ownerEmail]["filesAlreadyCached"] + " cached files.",
    "~buttonText~" : "See generated cache file",
    "~buttonUrl~" : "https://drive.google.com/open?id=" + cacheFileId + "&authuser=0",
    "~footerText~" : "Do not reply to this email."
  };
  var mailSendResult = setSendTransactionalEmail(GVAR.TRANSFER_OWNERSHIP_TO, mailVariablesObj);  // release lock
  Flog("Finalize user section and inform. Done!");
  userLock.releaseLock();
  return true; // RETURN
}

/**
* releases user lock if exists
* @returns {Bool} success
*/
function setReleaseUserLock() {
  var userLock = LockService.getUserLock();
  userLock.tryLock(10000);
  if (!userLock.hasLock()) {
    userLock.releaseLock();
  }
  return true;
}

/**
* sets ownership on given drive object (file, folder) via impersonization
*
* @param {String} driveObjectId drive object id (file, folder)
* @param {String} impersonatedUserEmail the email address of the user for which the application is requesting delegated access
* @param {String} transferOwnershipToEmail the email address to whom the ownership will be transfered
* @requires crypto (https://code.google.com/p/crypto-js/)
* @requires jsrsasign (http://kjur.github.io/jsrsasign/)
* @requires jwsjs (http://kjur.github.io/jsjws/)
* @requires countdownjs (http://countdownjs.org/)
* @returns {Bool} true if ownership transfered successfully
*/
function setImpersonatedOwnership(driveObjectId, impersonatedUserEmail, transferOwnershipToEmail) {
  // same ownership switch
  if (impersonatedUserEmail === transferOwnershipToEmail) {return true};
  if (typeof driveObjectId === "undefined") {return false};
  // get impersonated oauth token
  var oauthToken = getImpersonatedAccessToken(impersonatedUserEmail, GVAR.SERVICE_ACCOUNT_EMAIL, GVAR.SCOPES_SPACE_SEPARATED, GVAR.GOOGLE_DEV_CONSOLE_OAUTH_P12_BASE64, true);
  // generate fetch data
  var payloadObj = {
    "role" : "owner",
    "type" : "user",
    "value" : transferOwnershipToEmail
  };
  /*var payloadObj = {};*/
  //var payloadJson = encodeURIComponent(JSON.stringify(payloadObj)); // does not work
  var payloadJson = JSON.stringify(payloadObj);
  var fetchOpt = {
    "method" : "post",
    //"method" : "get",
    "contentType" : "application/json",
    "muteHttpExceptions" : false,
    "headers" : { //http://en.wikipedia.org/wiki/List_of_HTTP_header_fields
      "User-Agent" : "curl/7.38.0", // not documented but key element to get impersonization in google apps script to work
      "Authorization" : "Bearer " + oauthToken
    },
    "payload" : payloadJson
  }
  //var fetchUrl = "https://www.googleapis.com/drive/v2/permissionIds/" + transferOwnershipToEmail; // debug only
  //var fetchUrl = "https://www.googleapis.com/drive/v2/files/" + driveObjectId + "/touch"; // debug only
  var fetchUrl = "https://www.googleapis.com/drive/v2/files/" + driveObjectId + "/permissions";
  var fetchResponse = UrlFetchApp.fetch(fetchUrl, fetchOpt);
  // parse response
  if (fetchResponse.getResponseCode() == 200){
    //var responseContent = JSON.parse(fetchResponse.getContentText()); // debug only
    return true;
  }
  if (fetchResponse.getResponseCode() == 500){
    Flog("Error 500 for drive object id: " + driveObjectId);
    return false;
  }
  if (fetchResponse.getResponseCode() != 200 || fetchResponse.getResponseCode() != 500){
    throw new Error("Oops! Failed to parse response or invalid response code obtained.");
  }
}

/**
* returns impersonated oauth token
*
* @param {String} impersonatedUserEmail the email address of the user for which the application is requesting delegated access
* @param {String} serviceAccountEmail service account email address
* @param {String} scopesSpaceSeparated oauth scopes separated by space
* @param {String} oauthServiceAccountPrivateKeyBase64 service account p12 key generated from google developer console
* @param {Bool} cacheTokenFromToUserCache cache token from/to user cache switch
* @requires crypto (https://code.google.com/p/crypto-js/)
* @requires jsrsasign (http://kjur.github.io/jsrsasign/)
* @requires jwsjs (http://kjur.github.io/jsjws/)
* @requires countdownjs (http://countdownjs.org/)
* @returns {String|Bool} accessToken impersonated oauth access token or false if error
*/
function getImpersonatedAccessToken(impersonatedUserEmail, serviceAccountEmail, scopesSpaceSeparated, oauthServiceAccountPrivateKeyBase64, cacheTokenFromToUserCache){
  // catch exception
  try {
    // get token from cache
    var cacheHash = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, (serviceAccountEmail + "." + impersonatedUserEmail + "." + scopesSpaceSeparated), Utilities.Charset.US_ASCII);
    var cachedToken = CacheService.getUserCache().get(cacheHash);
    if (cachedToken && cacheTokenFromToUserCache) {return cachedToken;}
    // log duration
    //Flog("Time to check and get cache: " + countdown(startTime, new Date(), countdown.ALL).toString()); // debug only
  } catch(e) {
    Flog("Cano not get token from cache or cache token! " + e);
    throw new Error("Oops! Failed to get token from cache or cache token.");
  }
  // catch exception
  try {
    // generate header
    var jwtHeader = {
      "alg" : "RS256",
      "typ" : "JWT"
    };
    var tStart = Math.floor((new Date().getTime()) / 1000);
    var tStop = tStart + 3600;
    // generate claim set payload
    var jwtClaimSet = {
      "iss" : serviceAccountEmail,
      "sub" : impersonatedUserEmail,
      "scope" : scopesSpaceSeparated,
      "aud" : "https://accounts.google.com/o/oauth2/token",
      "exp" : tStop,
      "iat" : tStart
    };
    var jwtHeaderBase64 = Utilities.base64Encode(JSON.stringify(jwtHeader));
    var jwtClaimBase64 = Utilities.base64Encode(JSON.stringify(jwtClaimSet));
    var jwtPemCert = Utilities.newBlob(Utilities.base64Decode(oauthServiceAccountPrivateKeyBase64, Utilities.Charset.UTF_8)).getDataAsString();
  } catch(e) {
    Flog("Can not generate JWT variables! " + e);
    throw new Error("Oops! Failed to generate JWT variables."); 
  }
  // catch exception
  try {
    // generate jws
    var jwsjsObj = new KJUR.jws.JWS();
    var rsaKey = new RSAKey();
    rsaKey.readPrivateKeyFromPEMString(jwtPemCert);
    var jwsResult = rsaKey.signStringWithSHA256(jwtHeaderBase64 + "." + jwtClaimBase64);
    var signedJwsResultBase64 = hex2b64(jwsResult);
    // https://developers.google.com/accounts/docs/OAuth2ServiceAccount
    var assertionStr = jwtHeaderBase64 + "." + jwtClaimBase64 + "." + signedJwsResultBase64; // {Base64url encoded header}.{Base64url encoded claim set}.{Base64url encoded signature}
    // log duration
    //Flog("Time to generate JWS: " + countdown(startTime, new Date(), countdown.ALL).toString()); // debug only
  } catch(e) {
    Flog("Can not generate JWS! " + e);
    throw new Error("Oops! Failed to generate JWS."); 
  }
  // catch exception
  try {
    // get token and parse response
    var fetchOpt = {
      "method" : "post",
      "payload" : {
        "grant_type" : "urn:ietf:params:oauth:grant-type:jwt-bearer",
        //"access_type" : "offline", // not allowed for impersonization
        "assertion" : assertionStr
      }};
    var fetchResponse = UrlFetchApp.fetch("https://accounts.google.com/o/oauth2/token", fetchOpt);
    // log duration
    //Flog("Time to get token: " + countdown(startTime, new Date(), countdown.ALL).toString()); // debug only
  } catch(e) {
    Flog("Can not fetch oAuth 2.0 URL!" + e);
    throw new Error("Oops! Failed to fetch oAuth 2.0 URL.");
  }
  // parse response
  if(fetchResponse.getResponseCode() == 200){
    var responseContent = JSON.parse(fetchResponse.getContentText());
  } else {
    throw new Error("Oops! Failed to parse response or invalid response code obtained.");
  }
  // catch exception
  try {
    // cache token
    if (cacheTokenFromToUserCache) {CacheService.getUserCache().put(cacheHash, responseContent.access_token, 3550)};
  } catch(e) {
    Flog("Can not put token to cache! " + e);
    throw new Error("Oops! Failed to put token to cache.");
  }
  // return success
  return responseContent.access_token;
}
