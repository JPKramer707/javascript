/**
 * FlashObject v1.2.3: Flash detection and embed - http://blog.deconcept.com/flashobject/
 *
 * FlashObject is (c) 2005 Geoff Stearns and is released under the MIT License:
 * http://www.opensource.org/licenses/mit-license.php
 *
 */

if(typeof com == "undefined") var com = new Object();
if(typeof com.deconcept == "undefined") com.deconcept = new Object();
if(typeof com.deconcept.util == "undefined") com.deconcept.util = new Object();
if(typeof com.deconcept.FlashObjectUtil == "undefined") com.deconcept.FlashObjectUtil = new Object();

/* ---- detection functions ---- */
com.deconcept.FlashObjectUtil.getPlayerVersion = function(){
   var PlayerVersion = new com.deconcept.PlayerVersion(0,0,0);
	if(navigator.plugins && navigator.mimeTypes.length){
		var x = navigator.plugins["Shockwave Flash"];
		if(x && x.description) {
			PlayerVersion = new com.deconcept.PlayerVersion(x.description.replace(/([a-z]|[A-Z]|\s)+/, "").replace(/(\s+r|\s+b[0-9]+)/, ".").split("."));
		}
	}else if (window.ActiveXObject){
	   try {
   	   var axo = new ActiveXObject("ShockwaveFlash.ShockwaveFlash");
   		PlayerVersion = new com.deconcept.PlayerVersion(axo.GetVariable("$version").split(" ")[1].split(","));
	   } catch (e) {}
	}
	return PlayerVersion;
}
com.deconcept.PlayerVersion = function(arrVersion){
	this.major = parseInt(arrVersion[0]) || 0;
	this.minor = parseInt(arrVersion[1]) || 0;
	this.rev = parseInt(arrVersion[2]) || 0;
}
com.deconcept.PlayerVersion.prototype.versionIsValid = function(fv){
	if(this.major < fv.major) return false;
	if(this.major > fv.major) return true;
	if(this.minor < fv.minor) return false;
	if(this.minor > fv.minor) return true;
	if(this.rev < fv.rev) return false;
	return true;
}