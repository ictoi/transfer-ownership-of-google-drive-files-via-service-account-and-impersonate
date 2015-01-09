/** @preserve
 * jwsjs.js - JSON Web Signature JSON Serialization (JWSJS) Class
 *
 * version: 2.0.0 (2013 Jul 20)
 *
 * Copyright (c) 2010-2013 Kenji Urushima (kenji.urushima@gmail.com)
 *
 * This software is licensed under the terms of the MIT License.
 * http://kjur.github.com/jsjws/license/
 *
 * The above copyright and license notice shall be 
 * included in all copies or substantial portions of the Software.
 */

/**
 * @fileOverview
 * @name jwsjs-2.0.js
 * @author Kenji Urushima kenji.urushima@gmail.com
 * @version 2.0.0 (2013 Jul 20)
 * @since jsjws 1.2
 * @license <a href="http://kjur.github.io/jsjws/license/">MIT License</a>
 */

if (typeof KJUR == "undefined" || !KJUR) KJUR = {};
if (typeof KJUR.jws == "undefined" || !KJUR.jws) KJUR.jws = {};

/**
 * JSON Web Signature JSON Serialization (JWSJS) class.<br/>
 * @class JSON Web Signature JSON Serialization (JWSJS) class
 * @name KJUR.jws.JWSJS
 * @property {array of String} aHeader array of Encoded JWS Headers
 * @property {String} sPayload Encoded JWS payload
 * @property {array of String} aSignature array of Encoded JWS signature value
 * @author Kenji Urushima
 * @version 1.0 (18 May 2012)
 * @requires base64x.js, json-sans-eval.js, jws.js and jsrsasign library
 * @see <a href="http://kjur.github.com/jsjws/">'jwjws'(JWS JavaScript Library) home page http://kjur.github.com/jsjws/</a>
 * @see <a href="http://kjur.github.com/jsrsasigns/">'jwrsasign'(RSA Sign JavaScript Library) home page http://kjur.github.com/jsrsasign/</a>
 * @see <a href="http://tools.ietf.org/html/draft-jones-json-web-signature-json-serialization-01">IETF I-D JSON Web Signature JSON Serialization (JWS-JS) specification</a>
 */
KJUR.jws.JWSJS = function() {
    this.aHeader = [];
    this.sPayload = "";
    this.aSignature = [];

    // == initialize ===================================================================
    /**
     * (re-)initialize this object.<br/>
     * @name init
     * @memberOf KJUR.jws.JWSJS
     * @function
     */
    this.init = function() {
	this.aHeader = [];
	this.sPayload = "";
	this.aSignature = [];
    };

    /**
     * (re-)initialize and set first signature with JWS.<br/>
     * @name initWithJWS
     * @memberOf KJUR.jws.JWSJS
     * @param {String} sJWS JWS signature to set
     * @function
     */
    this.initWithJWS = function(sJWS) {
	this.init();

	var jws = new KJUR.jws.JWS();
	jws.parseJWS(sJWS);

	this.aHeader.push(jws.parsedJWS.headB64U);
	this.sPayload = jws.parsedJWS.payloadB64U;
	this.aSignature.push(jws.parsedJWS.sigvalB64U);
    };

    // == add signature ===================================================================
    /**
     * add a signature to existing JWS-JS by Header and PKCS1 private key.<br/>
     * @name addSignatureByHeaderKey
     * @memberOf KJUR.jws.JWSJS
     * @function
     * @param {String} sHead JSON string of JWS Header for adding signature.
     * @param {String} sPemPrvKey string of PKCS1 private key
     */
    this.addSignatureByHeaderKey = function(sHead, sPemPrvKey) {
	var sPayload = b64utoutf8(this.sPayload);

	var jws = new KJUR.jws.JWS();
	var sJWS = jws.generateJWSByP1PrvKey(sHead, sPayload, sPemPrvKey);
  
	this.aHeader.push(jws.parsedJWS.headB64U);
	this.aSignature.push(jws.parsedJWS.sigvalB64U);
    };

    /**
     * add a signature to existing JWS-JS by Header, Payload and PKCS1 private key.<br/>
     * This is to add first signature to JWS-JS object.
     * @name addSignatureByHeaderPayloadKey
     * @memberOf KJUR.jws.JWSJS
     * @function
     * @param {String} sHead JSON string of JWS Header for adding signature.
     * @param {String} sPayload string of JWS Payload for adding signature.
     * @param {String} sPemPrvKey string of PKCS1 private key
     */
    this.addSignatureByHeaderPayloadKey = function(sHead, sPayload, sPemPrvKey) {
	var jws = new KJUR.jws.JWS();
	var sJWS = jws.generateJWSByP1PrvKey(sHead, sPayload, sPemPrvKey);
  
	this.aHeader.push(jws.parsedJWS.headB64U);
	this.sPayload = jws.parsedJWS.payloadB64U;
	this.aSignature.push(jws.parsedJWS.sigvalB64U);
    };

    // == verify signature ===================================================================
    /**
     * verify JWS-JS object with array of certificate string.<br/>
     * @name verifyWithCerts
     * @memberOf KJUR.jws.JWSJS
     * @function
     * @param {array of String} aCert array of string for X.509 PEM certificate.
     * @return 1 if signature is valid.
     * @throw if JWS-JS signature is invalid.
     */
    this.verifyWithCerts = function(aCert) {
	if (this.aHeader.length != aCert.length) 
	    throw "num headers does not match with num certs";
	if (this.aSignature.length != aCert.length) 
	    throw "num signatures does not match with num certs";

	var payload = this.sPayload;
	var errMsg = "";
	for (var i = 0; i < aCert.length; i++) {
	    var cert = aCert[i];
	    var header = this.aHeader[i];
	    var sig = this.aSignature[i];
	    var sJWS = header + "." + payload + "." + sig;

	    var jws = new KJUR.jws.JWS();
	    try {
		var result = jws.verifyJWSByPemX509Cert(sJWS, cert);
		if (result != 1) {
		    errMsg += (i + 1) + "th signature unmatch. ";
		}
	    } catch (ex) {
		errMsg += (i + 1) + "th signature fail(" + ex + "). ";
	    }
	}

	if (errMsg == "") {
	    return 1;
	} else {
	    throw errMsg;
	}
    };

    /**
     * read JWS-JS string.<br/>
     * @name raedJWSJS
     * @memberOf KJUR.jws.JWSJS
     * @function
     * @param {String} string of JWS-JS to load.
     * @throw if sJWSJS is malformed or not JSON string.
     */
    this.readJWSJS = function(sJWSJS) {
	var jws = new KJUR.jws.JWS();
	var oJWSJS = jws.readSafeJSONString(sJWSJS);
	if (oJWSJS == null) throw "argument is not JSON string: " + sJWSJS;

	this.aHeader = oJWSJS.headers;
	this.sPayload = oJWSJS.payload;
	this.aSignature = oJWSJS.signatures;
    };

    // == utility ===================================================================
    /**
     * get JSON object for this JWS-JS object.<br/>
     * @name getJSON
     * @memberOf KJUR.jws.JWSJS
     * @function
     */
    this.getJSON = function() {
	return { "headers": this.aHeader,
		 "payload": this.sPayload,
		 "signatures": this.aSignature }; 
    };

    /**
     * check if this JWS-JS object is empty.<br/>
     * @name isEmpty
     * @memberOf KJUR.jws.JWSJS
     * @function
     * @return 1 if there is no signatures in this object, otherwise 0.
     */
    this.isEmpty = function() {
	if (this.aHeader.length == 0) return 1; 
	return 0;
    };
};

/*! jws-2.0.3 (c) 2012 Kenji Urushima | kjur.github.com/jsjws/license
 */
/*
 * jws.js - JSON Web Signature Class
 *
 * version: 2.0.3 (2013 Jul 30)
 *
 * Copyright (c) 2010-2013 Kenji Urushima (kenji.urushima@gmail.com)
 *
 * This software is licensed under the terms of the MIT License.
 * http://kjur.github.com/jsjws/license/
 *
 * The above copyright and license notice shall be 
 * included in all copies or substantial portions of the Software.
 */

/**
 * @fileOverview
 * @name jws-2.0.js
 * @author Kenji Urushima kenji.urushima@gmail.com
 * @version 2.0.3 (2013-Jul-30)
 * @since jsjws 1.0
 * @license <a href="http://kjur.github.io/jsjws/license/">MIT License</a>
 */

if (typeof KJUR == "undefined" || !KJUR) KJUR = {};
if (typeof KJUR.jws == "undefined" || !KJUR.jws) KJUR.jws = {};

/**
 * JSON Web Signature(JWS) class.<br/>
 * @class JSON Web Signature(JWS) class
 * @property {Dictionary} parsedJWS This property is set after JWS signature verification. <br/>
 *           Following "parsedJWS_*" properties can be accessed as "parsedJWS.*" because of
 *           JsDoc restriction.
 * @property {String} parsedJWS_headB64U string of Encrypted JWS Header
 * @property {String} parsedJWS_payloadB64U string of Encrypted JWS Payload
 * @property {String} parsedJWS_sigvalB64U string of Encrypted JWS signature value
 * @property {String} parsedJWS_si string of Signature Input
 * @property {String} parsedJWS_sigvalH hexadecimal string of JWS signature value
 * @property {String} parsedJWS_sigvalBI BigInteger(defined in jsbn.js) object of JWS signature value
 * @property {String} parsedJWS_headS string of decoded JWS Header
 * @property {String} parsedJWS_headS string of decoded JWS Payload
 * @author Kenji Urushima
 * @version 1.1 (07 May 2012)
 * @requires base64x.js, json-sans-eval.js and jsrsasign library
 * @see <a href="http://kjur.github.com/jsjws/">'jwjws'(JWS JavaScript Library) home page http://kjur.github.com/jsjws/</a>
 * @see <a href="http://kjur.github.com/jsrsasigns/">'jwrsasign'(RSA Sign JavaScript Library) home page http://kjur.github.com/jsrsasign/</a>
 */
KJUR.jws.JWS = function() {

    // === utility =============================================================
    /**
     * check whether a String "s" is a safe JSON string or not.<br/>
     * If a String "s" is a malformed JSON string or an other object type
     * this returns 0, otherwise this returns 1.
     * @name isSafeJSONString
     * @memberOf KJUR.jws.JWS
     * @function
     * @param {String} s JSON string
     * @return {Number} 1 or 0
     */
    this.isSafeJSONString = function(s, h, p) {
	var o = null;
	try {
	    o = jsonParse(s);
	    if (typeof o != "object") return 0;
	    if (o.constructor === Array) return 0;
	    if (h) h[p] = o;
	    return 1;
	} catch (ex) {
	    return 0;
	}
    };

    /**
     * read a String "s" as JSON object if it is safe.<br/>
     * If a String "s" is a malformed JSON string or not JSON string,
     * this returns null, otherwise returns JSON object.
     * @name readSafeJSONString
     * @memberOf KJUR.jws.JWS
     * @function
     * @param {String} s JSON string
     * @return {Object} JSON object or null
     * @since 1.1.1
     */
    this.readSafeJSONString = function(s) {
	var o = null;
	try {
	    o = jsonParse(s);
	    if (typeof o != "object") return null;
	    if (o.constructor === Array) return null;
	    return o;
	} catch (ex) {
	    return null;
	}
    };

    /**
     * get Encoed Signature Value from JWS string.<br/>
     * @name getEncodedSignatureValueFromJWS
     * @memberOf KJUR.jws.JWS
     * @function
     * @param {String} sJWS JWS signature string to be verified
     * @return {String} string of Encoded Signature Value 
     * @throws if sJWS is not comma separated string such like "Header.Payload.Signature".
     */
    this.getEncodedSignatureValueFromJWS = function(sJWS) {
	if (sJWS.match(/^[^.]+\.[^.]+\.([^.]+)$/) == null) {
	    throw "JWS signature is not a form of 'Head.Payload.SigValue'.";
	}
	return RegExp.$1;
    };

    /**
     * parse JWS string and set public property 'parsedJWS' dictionary.<br/>
     * @name parseJWS
     * @memberOf KJUR.jws.JWS
     * @function
     * @param {String} sJWS JWS signature string to be parsed.
     * @throws if sJWS is not comma separated string such like "Header.Payload.Signature".
     * @throws if JWS Header is a malformed JSON string.
     * @since 1.1
     */
    this.parseJWS = function(sJWS, sigValNotNeeded) {
	if ((this.parsedJWS !== undefined) &&
	    (sigValNotNeeded || (this.parsedJWS.sigvalH !== undefined))) {
	    return;
	}
	if (sJWS.match(/^([^.]+)\.([^.]+)\.([^.]+)$/) == null) {
	    throw "JWS signature is not a form of 'Head.Payload.SigValue'.";
	}
	var b6Head = RegExp.$1;
	var b6Payload = RegExp.$2;
	var b6SigVal = RegExp.$3;
	var sSI = b6Head + "." + b6Payload;
	this.parsedJWS = {};
	this.parsedJWS.headB64U = b6Head;
	this.parsedJWS.payloadB64U = b6Payload;
	this.parsedJWS.sigvalB64U = b6SigVal;
	this.parsedJWS.si = sSI;

	if (!sigValNotNeeded) {
	    var hSigVal = b64utohex(b6SigVal);
	    var biSigVal = parseBigInt(hSigVal, 16);
	    this.parsedJWS.sigvalH = hSigVal;
	    this.parsedJWS.sigvalBI = biSigVal;
	}

	var sHead = b64utoutf8(b6Head);
	var sPayload = b64utoutf8(b6Payload);
	this.parsedJWS.headS = sHead;
	this.parsedJWS.payloadS = sPayload;

	if (! this.isSafeJSONString(sHead, this.parsedJWS, 'headP'))
	    throw "malformed JSON string for JWS Head: " + sHead;
    };

    // ==== JWS Validation =========================================================
    function _getSignatureInputByString(sHead, sPayload) {
	return utf8tob64u(sHead) + "." + utf8tob64u(sPayload);
    };

    function _getHashBySignatureInput(sSignatureInput, sHashAlg) {
	var hashfunc = function(s) { return KJUR.crypto.Util.hashString(s, sHashAlg); };
	if (hashfunc == null) throw "hash function not defined in jsrsasign: " + sHashAlg;
	return hashfunc(sSignatureInput);
    };

    function _jws_verifySignature(sHead, sPayload, hSig, hN, hE) {
	var sSignatureInput = _getSignatureInputByString(sHead, sPayload);
	var biSig = parseBigInt(hSig, 16);
	return _rsasign_verifySignatureWithArgs(sSignatureInput, biSig, hN, hE);
    };

    /**
     * verify JWS signature with naked RSA public key.<br/>
     * This only supports "RS256" and "RS512" algorithm.
     * @name verifyJWSByNE
     * @memberOf KJUR.jws.JWS
     * @function
     * @param {String} sJWS JWS signature string to be verified
     * @param {String} hN hexadecimal string for modulus of RSA public key
     * @param {String} hE hexadecimal string for public exponent of RSA public key
     * @return {String} returns 1 when JWS signature is valid, otherwise returns 0
     * @throws if sJWS is not comma separated string such like "Header.Payload.Signature".
     * @throws if JWS Header is a malformed JSON string.
     */
    this.verifyJWSByNE = function(sJWS, hN, hE) {
	this.parseJWS(sJWS);
	return _rsasign_verifySignatureWithArgs(this.parsedJWS.si, this.parsedJWS.sigvalBI, hN, hE);    
    };

    /**
     * verify JWS signature with RSA public key.<br/>
     * This only supports "RS256", "RS512", "PS256" and "PS512" algorithms.
     * @name verifyJWSByKey
     * @memberOf KJUR.jws.JWS
     * @function
     * @param {String} sJWS JWS signature string to be verified
     * @param {RSAKey} key RSA public key
     * @return {Boolean} returns true when JWS signature is valid, otherwise returns false
     * @throws if sJWS is not comma separated string such like "Header.Payload.Signature".
     * @throws if JWS Header is a malformed JSON string.
     */
    this.verifyJWSByKey = function(sJWS, key) {
	this.parseJWS(sJWS);
	var hashAlg = _jws_getHashAlgFromParsedHead(this.parsedJWS.headP);
        var isPSS = this.parsedJWS.headP['alg'].substr(0, 2) == "PS";

	if (key.hashAndVerify) {
	    return key.hashAndVerify(hashAlg,
				     new Buffer(this.parsedJWS.si, 'utf8').toString('base64'),
				     b64utob64(this.parsedJWS.sigvalB64U),
				     'base64',
				     isPSS);
	} else if (isPSS) {
	    return key.verifyStringPSS(this.parsedJWS.si,
				       this.parsedJWS.sigvalH, hashAlg);
	} else {
	    return key.verifyString(this.parsedJWS.si,
				    this.parsedJWS.sigvalH);
	}
    };

    /**
     * verify JWS signature by PEM formatted X.509 certificate.<br/>
     * This only supports "RS256" and "RS512" algorithm.
     * @name verifyJWSByPemX509Cert
     * @memberOf KJUR.jws.JWS
     * @function
     * @param {String} sJWS JWS signature string to be verified
     * @param {String} sPemX509Cert string of PEM formatted X.509 certificate
     * @return {String} returns 1 when JWS signature is valid, otherwise returns 0
     * @throws if sJWS is not comma separated string such like "Header.Payload.Signature".
     * @throws if JWS Header is a malformed JSON string.
     * @since 1.1
     */
    this.verifyJWSByPemX509Cert = function(sJWS, sPemX509Cert) {
	this.parseJWS(sJWS);
	var x509 = new X509();
	x509.readCertPEM(sPemX509Cert);
	return x509.subjectPublicKeyRSA.verifyString(this.parsedJWS.si, this.parsedJWS.sigvalH);
    };

    // ==== JWS Generation =========================================================
    function _jws_getHashAlgFromParsedHead(head) {
	var sigAlg = head["alg"];
	var hashAlg = "";

	if (sigAlg != "RS256" && sigAlg != "RS512" &&
	    sigAlg != "PS256" && sigAlg != "PS512")
	    throw "JWS signature algorithm not supported: " + sigAlg;
	if (sigAlg.substr(2) == "256") hashAlg = "sha256";
	if (sigAlg.substr(2) == "512") hashAlg = "sha512";
	return hashAlg;
    };

    function _jws_getHashAlgFromHead(sHead) {
	return _jws_getHashAlgFromParsedHead(jsonParse(sHead));
    };

    function _jws_generateSignatureValueBySI_NED(sHead, sPayload, sSI, hN, hE, hD) {
	var rsa = new RSAKey();
	rsa.setPrivate(hN, hE, hD);

	var hashAlg = _jws_getHashAlgFromHead(sHead);
	var sigValue = rsa.signString(sSI, hashAlg);
	return sigValue;
    };

    function _jws_generateSignatureValueBySI_Key(sHead, sPayload, sSI, key, head) {
	var hashAlg = null;
	if (typeof head == "undefined") {
	    hashAlg = _jws_getHashAlgFromHead(sHead);
	} else {
	    hashAlg = _jws_getHashAlgFromParsedHead(head);
	}

	var isPSS = head['alg'].substr(0, 2) == "PS";

	if (key.hashAndSign) {
	    return b64tob64u(key.hashAndSign(hashAlg, sSI, 'binary', 'base64', isPSS));
	} else if (isPSS) {
	    return hextob64u(key.signStringPSS(sSI, hashAlg));
	} else {
	    return hextob64u(key.signString(sSI, hashAlg));
	}
    };

    function _jws_generateSignatureValueByNED(sHead, sPayload, hN, hE, hD) {
	var sSI = _getSignatureInputByString(sHead, sPayload);
	return _jws_generateSignatureValueBySI_NED(sHead, sPayload, sSI, hN, hE, hD);
    };

    /**
     * generate JWS signature by Header, Payload and a naked RSA private key.<br/>
     * This only supports "RS256" and "RS512" algorithm.
     * @name generateJWSByNED
     * @memberOf KJUR.jws.JWS
     * @function
     * @param {String} sHead string of JWS Header
     * @param {String} sPayload string of JWS Payload
     * @param {String} hN hexadecimal string for modulus of RSA public key
     * @param {String} hE hexadecimal string for public exponent of RSA public key
     * @param {String} hD hexadecimal string for private exponent of RSA private key
     * @return {String} JWS signature string
     * @throws if sHead is a malformed JSON string.
     * @throws if supported signature algorithm was not specified in JSON Header.
     */
    this.generateJWSByNED = function(sHead, sPayload, hN, hE, hD) {
	if (! this.isSafeJSONString(sHead)) throw "JWS Head is not safe JSON string: " + sHead;
	var sSI = _getSignatureInputByString(sHead, sPayload);
	var hSigValue = _jws_generateSignatureValueBySI_NED(sHead, sPayload, sSI, hN, hE, hD);
	var b64SigValue = hextob64u(hSigValue);
	
	this.parsedJWS = {};
	this.parsedJWS.headB64U = sSI.split(".")[0];
	this.parsedJWS.payloadB64U = sSI.split(".")[1];
	this.parsedJWS.sigvalB64U = b64SigValue;

	return sSI + "." + b64SigValue;
    };

    /**
     * generate JWS signature by Header, Payload and a RSA private key.<br/>
     * This only supports "RS256", "RS512", "PS256" and "PS512" algorithms.
     * @name generateJWSByKey
     * @memberOf KJUR.jws.JWS
     * @function
     * @param {String} sHead string of JWS Header
     * @param {String} sPayload string of JWS Payload
     * @param {RSAKey} RSA private key
     * @return {String} JWS signature string
     * @throws if sHead is a malformed JSON string.
     * @throws if supported signature algorithm was not specified in JSON Header.
     */
    this.generateJWSByKey = function(sHead, sPayload, key) {
	var obj = {};
	if (!this.isSafeJSONString(sHead, obj, 'headP'))
	    throw "JWS Head is not safe JSON string: " + sHead;
	var sSI = _getSignatureInputByString(sHead, sPayload);
	var b64SigValue = _jws_generateSignatureValueBySI_Key(sHead, sPayload, sSI, key, obj.headP);

	this.parsedJWS = {};
	this.parsedJWS.headB64U = sSI.split(".")[0];
	this.parsedJWS.payloadB64U = sSI.split(".")[1];
	this.parsedJWS.sigvalB64U = b64SigValue;

	return sSI + "." + b64SigValue;
    };

    // === sign with PKCS#1 RSA private key =====================================================
    function _jws_generateSignatureValueBySI_PemPrvKey(sHead, sPayload, sSI, sPemPrvKey) {
	var rsa = new RSAKey();
	rsa.readPrivateKeyFromPEMString(sPemPrvKey);
	var hashAlg = _jws_getHashAlgFromHead(sHead);
	var sigValue = rsa.signString(sSI, hashAlg);
	return sigValue;
    };

    /**
     * generate JWS signature by Header, Payload and a PEM formatted PKCS#1 RSA private key.<br/>
     * This only supports "RS256" and "RS512" algorithm.
     * @name generateJWSByP1PrvKey
     * @memberOf KJUR.jws.JWS
     * @function
     * @param {String} sHead string of JWS Header
     * @param {String} sPayload string of JWS Payload
     * @param {String} string for sPemPrvKey PEM formatted PKCS#1 RSA private key<br/>
     *                 Heading and trailing space characters in PEM key will be ignored.
     * @return {String} JWS signature string
     * @throws if sHead is a malformed JSON string.
     * @throws if supported signature algorithm was not specified in JSON Header.
     * @since 1.1
     */
    this.generateJWSByP1PrvKey = function(sHead, sPayload, sPemPrvKey) {
	if (! this.isSafeJSONString(sHead)) throw "JWS Head is not safe JSON string: " + sHead;
	var sSI = _getSignatureInputByString(sHead, sPayload);
	var hSigValue = _jws_generateSignatureValueBySI_PemPrvKey(sHead, sPayload, sSI, sPemPrvKey);
	var b64SigValue = hextob64u(hSigValue);

	this.parsedJWS = {};
	this.parsedJWS.headB64U = sSI.split(".")[0];
	this.parsedJWS.payloadB64U = sSI.split(".")[1];
	this.parsedJWS.sigvalB64U = b64SigValue;

	return sSI + "." + b64SigValue;
    };

};

/*! Mike Samuel (c) 2009 | code.google.com/p/json-sans-eval
 */
// This source code is free for use in the public domain.
// NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

// http://code.google.com/p/json-sans-eval/

/**
 * Parses a string of well-formed JSON text.
 *
 * If the input is not well-formed, then behavior is undefined, but it is
 * deterministic and is guaranteed not to modify any object other than its
 * return value.
 *
 * This does not use `eval` so is less likely to have obscure security bugs than
 * json2.js.
 * It is optimized for speed, so is much faster than json_parse.js.
 *
 * This library should be used whenever security is a concern (when JSON may
 * come from an untrusted source), speed is a concern, and erroring on malformed
 * JSON is *not* a concern.
 *
 *                      Pros                   Cons
 *                    +-----------------------+-----------------------+
 * json_sans_eval.js  | Fast, secure          | Not validating        |
 *                    +-----------------------+-----------------------+
 * json_parse.js      | Validating, secure    | Slow                  |
 *                    +-----------------------+-----------------------+
 * json2.js           | Fast, some validation | Potentially insecure  |
 *                    +-----------------------+-----------------------+
 *
 * json2.js is very fast, but potentially insecure since it calls `eval` to
 * parse JSON data, so an attacker might be able to supply strange JS that
 * looks like JSON, but that executes arbitrary javascript.
 * If you do have to use json2.js with untrusted data, make sure you keep
 * your version of json2.js up to date so that you get patches as they're
 * released.
 *
 * @param {string} json per RFC 4627
 * @param {function (this:Object, string, *):*} opt_reviver optional function
 *     that reworks JSON objects post-parse per Chapter 15.12 of EcmaScript3.1.
 *     If supplied, the function is called with a string key, and a value.
 *     The value is the property of 'this'.  The reviver should return
 *     the value to use in its place.  So if dates were serialized as
 *     {@code { "type": "Date", "time": 1234 }}, then a reviver might look like
 *     {@code
 *     function (key, value) {
 *       if (value && typeof value === 'object' && 'Date' === value.type) {
 *         return new Date(value.time);
 *       } else {
 *         return value;
 *       }
 *     }}.
 *     If the reviver returns {@code undefined} then the property named by key
 *     will be deleted from its container.
 *     {@code this} is bound to the object containing the specified property.
 * @return {Object|Array}
 * @author Mike Samuel <mikesamuel@gmail.com>
 */
var jsonParse = (function () {
  var number
      = '(?:-?\\b(?:0|[1-9][0-9]*)(?:\\.[0-9]+)?(?:[eE][+-]?[0-9]+)?\\b)';
  var oneChar = '(?:[^\\0-\\x08\\x0a-\\x1f\"\\\\]'
      + '|\\\\(?:[\"/\\\\bfnrt]|u[0-9A-Fa-f]{4}))';
  var string = '(?:\"' + oneChar + '*\")';

  // Will match a value in a well-formed JSON file.
  // If the input is not well-formed, may match strangely, but not in an unsafe
  // way.
  // Since this only matches value tokens, it does not match whitespace, colons,
  // or commas.
  var jsonToken = new RegExp(
      '(?:false|true|null|[\\{\\}\\[\\]]'
      + '|' + number
      + '|' + string
      + ')', 'g');

  // Matches escape sequences in a string literal
  var escapeSequence = new RegExp('\\\\(?:([^u])|u(.{4}))', 'g');

  // Decodes escape sequences in object literals
  var escapes = {
    '"': '"',
    '/': '/',
    '\\': '\\',
    'b': '\b',
    'f': '\f',
    'n': '\n',
    'r': '\r',
    't': '\t'
  };
  function unescapeOne(_, ch, hex) {
    return ch ? escapes[ch] : String.fromCharCode(parseInt(hex, 16));
  }

  // A non-falsy value that coerces to the empty string when used as a key.
  var EMPTY_STRING = new String('');
  var SLASH = '\\';

  // Constructor to use based on an open token.
  var firstTokenCtors = { '{': Object, '[': Array };

  var hop = Object.hasOwnProperty;

  return function (json, opt_reviver) {
    // Split into tokens
    var toks = json.match(jsonToken);
    // Construct the object to return
    var result;
    var tok = toks[0];
    var topLevelPrimitive = false;
    if ('{' === tok) {
      result = {};
    } else if ('[' === tok) {
      result = [];
    } else {
      // The RFC only allows arrays or objects at the top level, but the JSON.parse
      // defined by the EcmaScript 5 draft does allow strings, booleans, numbers, and null
      // at the top level.
      result = [];
      topLevelPrimitive = true;
    }

    // If undefined, the key in an object key/value record to use for the next
    // value parsed.
    var key;
    // Loop over remaining tokens maintaining a stack of uncompleted objects and
    // arrays.
    var stack = [result];
    for (var i = 1 - topLevelPrimitive, n = toks.length; i < n; ++i) {
      tok = toks[i];

      var cont;
      switch (tok.charCodeAt(0)) {
        default:  // sign or digit
          cont = stack[0];
          cont[key || cont.length] = +(tok);
          key = void 0;
          break;
        case 0x22:  // '"'
          tok = tok.substring(1, tok.length - 1);
          if (tok.indexOf(SLASH) !== -1) {
            tok = tok.replace(escapeSequence, unescapeOne);
          }
          cont = stack[0];
          if (!key) {
            if (cont instanceof Array) {
              key = cont.length;
            } else {
              key = tok || EMPTY_STRING;  // Use as key for next value seen.
              break;
            }
          }
          cont[key] = tok;
          key = void 0;
          break;
        case 0x5b:  // '['
          cont = stack[0];
          stack.unshift(cont[key || cont.length] = []);
          key = void 0;
          break;
        case 0x5d:  // ']'
          stack.shift();
          break;
        case 0x66:  // 'f'
          cont = stack[0];
          cont[key || cont.length] = false;
          key = void 0;
          break;
        case 0x6e:  // 'n'
          cont = stack[0];
          cont[key || cont.length] = null;
          key = void 0;
          break;
        case 0x74:  // 't'
          cont = stack[0];
          cont[key || cont.length] = true;
          key = void 0;
          break;
        case 0x7b:  // '{'
          cont = stack[0];
          stack.unshift(cont[key || cont.length] = {});
          key = void 0;
          break;
        case 0x7d:  // '}'
          stack.shift();
          break;
      }
    }
    // Fail if we've got an uncompleted object.
    if (topLevelPrimitive) {
      if (stack.length !== 1) { throw new Error(); }
      result = result[0];
    } else {
      if (stack.length) { throw new Error(); }
    }

    if (opt_reviver) {
      // Based on walk as implemented in http://www.json.org/json2.js
      var walk = function (holder, key) {
        var value = holder[key];
        if (value && typeof value === 'object') {
          var toDelete = null;
          for (var k in value) {
            if (hop.call(value, k) && value !== holder) {
              // Recurse to properties first.  This has the effect of causing
              // the reviver to be called on the object graph depth-first.

              // Since 'this' is bound to the holder of the property, the
              // reviver can access sibling properties of k including ones
              // that have not yet been revived.

              // The value returned by the reviver is used in place of the
              // current value of property k.
              // If it returns undefined then the property is deleted.
              var v = walk(value, k);
              if (v !== void 0) {
                value[k] = v;
              } else {
                // Deleting properties inside the loop has vaguely defined
                // semantics in ES3 and ES3.1.
                if (!toDelete) { toDelete = []; }
                toDelete.push(k);
              }
            }
          }
          if (toDelete) {
            for (var i = toDelete.length; --i >= 0;) {
              delete value[toDelete[i]];
            }
          }
        }
        return opt_reviver.call(holder, key, value);
      };
      result = walk({ '': result }, '');
    }

    return result;
  };
})();
