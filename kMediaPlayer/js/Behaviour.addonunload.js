/**
 * Adds an event to those registered to execute on
 * window unload.
 * Extends Behaviour, if in use.
 */
if(typeof Behaviour == "undefined") var Behaviour = new Object();
Behaviour.addUnLoadEvent = function(func) {
	var oldonunload = window.onunload;

	if (typeof window.onunload != 'function') {
		window.onunload = func;
	} else {
		window.onunload = function() {
			oldonunload();
			func();
		}
	}
}
