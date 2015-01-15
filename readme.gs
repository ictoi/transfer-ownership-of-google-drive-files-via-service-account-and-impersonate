/*
* 
* NAME:
* 
* Transfer Ownership
* 
* VERSION:
* 
* 1.2.3.1 (2015-01-15)
* 
* LICENSE:
* 
* Copyright (C) 2015 Václav VESELÝ ⊂ ICTOI, s.r.o.; www.ictoi.com
* 
* This program is free software: you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.
* 
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU General Public License for more details.
* 
* You should have received a copy of the GNU General Public License
* along with this program.  If not, see <http://www.gnu.org/licenses/>.
*
*/

/* Google Apps Domain-Wide Delegation of Authority help links
*
* https://developers.google.com/drive/web/delegation#delegate_domain-wide_authority_to_your_service_account
* https://developers.google.com/google-apps/documents-list/#using_google_apps_administrative_access_to_impersonate_other_domain_users
* https://developers.google.com/gmail/xoauth2_protocol
* https://developers.google.com/drive/web/push
* https://developers.google.com/accounts/docs/OAuth2ServiceAccount
* https://developers.google.com/console/help/
* https://github.com/mcdanielgilbert/gas-oauth2-gae
* http://stackoverflow.com/questions/8999932/generating-rsa-sha1-signatures-with-javascript
* http://stackoverflow.com/questions/13652706/is-it-possible-to-impersonate-domains-users-with-google-drive-api-using-google
* http://stackoverflow.com/questions/25943631/how-can-i-create-google-apps-user-account-programatically/25950294#25950294
* curl -H "Authorization: Bearer TOKEN" https://www.googleapis.com/drive/v2/files
*/

/*
* KNOWN LIMITS as on 2014-11-07 on Google Apps for Work
*
* https://developers.google.com/apps-script/guides/services/quotas
*
* Script runtime = 6 min / execution
* Triggers total runtime = 6 hr / day
* URL Fetch calls = 100,000 / day
* URL Fetch data received = 100MB / day
* Properties write = 500,000 / day
* Properties total storage = 500kB / property store
* Properties value size = 9kB / val
* One cache file size = 10MB
* Continuation tokens are generally valid for one week
* Does not work on Google Apps Free edition for files other than native as in https://support.google.com/drive/answer/2494892?hl=en
*/

/*
* PREREQUISITES
*
* script has to be run as a domain super administrator see https://support.google.com/a/answer/2405986
*/

/*
* INSTALLATION
*
* login as domain super administrator
* open new tab
* browse to google developer console > https://console.developers.google.com/project
* create new project
* choose whatever name and project id
* navigate to "APIs & auth > Credentials > OAuth" and click "Create new Client ID"
* choose "Service account"
* copy EMAIL ADDRESS to script global variable SERVICE_ACCOUNT_EMAIL (replace the sample)
* copy CLIENT ID for later use to some text editor
* get openssl (don feed gluttons use Linux :], if on Windows try http://slproweb.com/products/Win32OpenSSL.html)
* transform your P12 key to base64 pem via terminal "openssl pkcs12 -in ~/certfilename.p12 -nodes | openssl rsa | base64 > ~/certfilename.pem.b64" (as password use 'notasecret' or whatever given by console) (adjust the command with your paths and system specifics)
* copy all text contained in openssl generated file via some text editor and remove all newlines so you have one long text string
* copy the long text string from previous step to script global variable GOOGLE_DEV_CONSOLE_OAUTH_P12_BASE64 (replace the sample)
* in the script replace all global variables in Globals.gs preferable ending with "// change for production" to whatever you want on your domain
* navigate to "APIs & auth > APIs > Browse APIs" an allow all APIs that you are going to use (in this example Drive API)
* open new tab
* browse to google apps admin console > https://admin.google.com/
* navigate to "Security > Advanced settings (may be hidden under Show more) > Authentication > Manage API client access"
* copy CLIENT ID stored in previous step to "Authorized API clients"
* fill all scopes to "One or More API Scopes"; the scopes must be the same as in global variable SCOPES_SPACE_SEPARATED (see scopes here https://developers.google.com/drive/web/scopes)
* click Authorize
* open script tab
* do first dry run to authorize the script
*/

/*
* DEFAULT SCRIPT OAUTH SCOPES
* https://mail.google.com/
* https://www.googleapis.com/auth/drive
* https://www.googleapis.com/auth/drive.apps.readonly
* https://www.googleapis.com/auth/script.external_request
*/

/*
* GENERATE DRIVE TEST STRUCTURE
*
* generate random dir structure with shell script and upload to drive
* http://stackoverflow.com/questions/13400312/linux-create-random-directory-file-hierarchy
*
* OUTDIR, ASCIIONLY, DIRDEPTH, MAXFIRSTLEVELDIRS, MAXDIRCHILDREN, MAXDIRNAMELEN, MAXFILECHILDREN, MAXFILENAMELEN, MAXFILESIZE
* ./rndtree.sh ./rndtree_b 1 6 8 50 8 1 8 1 // dynamic
* ./rndtree.sh ./rndtree_b 1 5 8 500 8 1 8 1 // steep
*/
