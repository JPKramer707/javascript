/**
 * EventSelectors.onDOMLoad()
 *
 * Fires an event after the DOM has loaded, but before binary
 * assets have necessarily loaded.
 *
 * Original code by:
 *   Dean Edwards/Matthias Miller/John Resig (http://dean.edwards.name/weblog/2006/06/again/)
 *
 * Modified to work with EventSelectors by:
 *   Kramer (060915)
 *
 * Warning: Make sure that this file is included AFTER EventSelectors,
 * as it extends said library.
 **/
EventSelectors.onDOMLoadFunctions = [];
EventSelectors.onDOMLoad = function(func) {
	EventSelectors.onDOMLoadFunctions.push(func);
};
EventSelectors.DOMLoaded = function() {
	// quit if this function has already been called
	if (arguments.callee.done) return;

	// flag this function so we don't do the same thing twice
	arguments.callee.done = true;

	// kill the timer
	if (_timer) clearInterval(_timer);

	for (var x=0; x<EventSelectors.onDOMLoadFunctions.length; x++) {
		EventSelectors.onDOMLoadFunctions[x]();
	}
};

/* for Mozilla/Opera9 */
if (document.addEventListener) {
	document.addEventListener("DOMContentLoaded", EventSelectors.DOMLoaded, false);
}

/* for Internet Explorer */
/*@cc_on @*/
/*@if (@_win32)
	document.write("<script id=__ie_onload defer src=javascript:void(0)><\/script>");
	var script = document.getElementById("__ie_onload");
	script.onreadystatechange = function() {
		if (this.readyState == "complete") {
			EventSelectors.DOMLoaded(); // call the onload handler
		}
	};
/*@end @*/

/* for Safari */
if (/WebKit/i.test(navigator.userAgent)) { // sniff
	var _timer = setInterval(function() {
		if (/loaded|complete/.test(document.readyState)) {
			EventSelectors.DOMLoaded(); // call the onload handler
		}
	}, 10);
}
