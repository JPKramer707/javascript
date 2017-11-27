/* Patches to Prototype
------------------------ */
/**
 * Tons faster and simpler than Prototype's
 */
Element.hasClassName = function(element, className) {
	return Element.manipulateClass(element, className, 'find');
}
Element.addClassName = function(element, className) {
	return Element.manipulateClass(element, className, 'add');
}
Element.removeClassName = function(element, className) {
	return Element.manipulateClass(element, className, 'remove');
}
Element.clearClassNames = function(element) {
	element.className = '';
}
Element.manipulateClass = function(element, className, doWhat) {
	//var classes = element.getAttribute('className');
	var classes = element.className;
	var cNames = [];
	if (classes != null) {
		cNames = classes.split(' ');
		if (doWhat == 'remove') {
			cNames = cNames.deleteVals(className)
		} else {
			for (var x=0; x<cNames.length; x++) {
				if (cNames[x] == className) return (doWhat == 'find');
			}
		}
	}
	if (doWhat == 'add') {
		if (typeof(className) == 'array') {
			cNames = cNames.concat(className);
		} else {
			cNames.push(className);
		}
	}
	if (doWhat == 'add' || doWhat == 'remove') {
		//element.setAttribute('className', cNames.join(' ').trim());
		element.className = cNames.join(' ').trim();
	}
	if (doWhat == 'find') return false;
}
/**
 * Returns the keycode related to an event, browser-independent
 */
Event.keyCode = function(event) {
	if (typeof(event.which) == 'undefined') return event.keyCode;
	return Math.max(event.which, event.keyCode);
};

/**
 * Element.visible
 * By Kramer
 *
 * I was disappointed that Prototype's Element.visible really only
 * reports on the status of element.style.display. What I really
 * wanted to know was "can the user see this element, or is it
 * contained inside a hidden element?" This extension fixes that with
 * the new "recursive" option.
 *
 * Recursive option added to seek up the tree to make sure
 * all parent nodes are visible, too. This should effectively
 * return a true/false indicating whether the given element is
 * indeed VISIBLE TO THE USER.
 */
Element.visible = function(element, recursive) {
	if (!recursive) return $(element).style.display != 'none';
	var search = element;
	while (search = search.parentNode) {
		if ($(search).style.display == 'none') return false;
	}
	return true;
}

/**
 * Event.observe now returns an ID which can be sent to Event.stopObserving to terminate that event handler.
 */
Event.registry = [];
Event.id = 0;
Event._observe = Event.observe;
Event.observe = function(element, name, observer, useCapture) {
	Event.id++;
	var regEntry = {
		id: Event.id,
		element: element,
		name: name,
		observer: observer,
		useCapture: useCapture
	};
	Event.registry.push(regEntry);
	Event._observe(element, name, observer, useCapture);
	return regEntry;
}
Event.unObserve = function(regEntry) {
	for (var x=0; x<Event.registry.length; x++) {
		var a = Event.registry[x];
		if (a.id == regEntry.id) {
			Event.registry.splice(x, 1);
			Event.stopObserving(a.element, a.name, a.observer, a.useCapture);
			return true;
		}
	}
	return false;
}



/* Object Extentions
-------------------------*/
/**
 * Get Url Argument
 * Turns a URL into an argument for links which function
 * purely as event launchers.
 */
String.prototype.getUrlArgument = function() {
	// Parses a URL like "javascript:void(42);" and returns "42"
	if (val = this.match(/[Jj]avascript:void\(\'?(.*?)\'?\);?/i)) {
		if (val[1]) return val[1];
	}
	return this;
}

/**
 * Is Numeric
 * checks if a string is a number
 */
String.prototype.isNumeric = function () {
	return !this.match(/\D/);
}

/**
 * In Array
 * Finds a value in an array
 */
Array.prototype.inArray = function(needle) {
	if (this.length > 0) {
		for (var n=0; n<this.length; n++) {
			if (this[n] == needle) return n;
		}
	}
	return -1;
}

/**
 * Extends the .substring() method to allow negative numbers to
 * reference indices from the end of the string rather than the beginning.
 */
String.prototype.substring = function(start, end) {
	if (start < 0) start = this.length + start;
	if (end < 0) end = this.length + end;
	if (end !== 0 && !end) end = this.length;
	var newString = '';
	for (var ssi=start; ssi<end; ssi++) {
		newString += this.charAt(ssi);
	}
	return newString;
}

String.prototype.htmlEntities = function() {
	var chars = {
		'&': 'amp',	'<': 'lt', '>': 'gt', '\"': 'quot'
	};

	var newString = this;
	for (var chacacter in chars) {
		var regExp = new RegExp();
		regExp.compile(chacacter,'g');
		newString = newString.replace(regExp, '&'+chars[chacacter]+';');
	}
	return newString;
}

/**
 * Deletes any occurrences of needle from Array
 * Not recommended for use on multidimensional arrays.
 */
Array.prototype.deleteVals = function(needle) {
	newValue = new Array();
	if (this.length > 0) {
		for (var n=0; n<this.length; n++) {
			if (this[n] != needle) newValue.push(this[n]);
		}
	}
	return newValue;
}

/**
 * Weeds out duplicate values in an array.
 * Not recommended for use on multidimensional arrays.
 */
Array.prototype.unique = function() {
	newArray = new Array();
	for (key in this) {
		if (typeof(this[key]) != 'function') {
			if (newArray.inArray(this[key]) == -1) newArray.push(this[key]);
		}
	}
	return newArray;
}

/**
 * Get Url Argument
 * Turns a URL into an argument for links which function
 * purely as event launchers.
 */
String.prototype.getUrlArgument = function() {
	// Parses a URL like "javascript:void(42);" and returns "42"
	if (val = this.match(/[Jj]avascript:void\(\'?(.*?)\'?\);?/i)) {
		if (val[1]) return val[1];
	}
	return this;
}

/**
 * Trims a string
 */
String.prototype.trim = function() {
	return this.replace(/^\s+/g, '').replace(/\s+$/g, '');
}

/**
 * Is Numeric
 * checks if a string is a number
 */
String.prototype.isNumeric = function () {
	return !this.match(/\D/);
}

/**
 * In Array
 * Finds a value in an array
 */
Array.prototype.inArray = function(needle) {
	if (this.length > 0) {
		for (var n=0; n<this.length; n++) {
			if (this[n] == needle) return n;
		}
	}
	return -1;
}

/**
 * Pads a number with zeroes until it is the desired length (digits)
 * (Caution: Returns a string, not a float, out of necessity)
 * Example: (7).zeroPad(3) == '007'
 */
Number.prototype.zeroPad = function(digits) {
	// Pads a number with zeroes until it is at least digits long
	// Currently expects an integer
	var str = this.toString();
	while (str.length < digits) {
		str = '0'+str;
	}
	return str;
}



/* Plain Old Functions
-------------------------- */
function getViewportCenter() {
	return {
		x: getViewportSize().width/2,
		y: getViewportSize().height/2
	};
}
function getViewportSize() {
	return {
		width: self.innerWidth || (document.documentElement.clientWidth || document.body.clientWidth),
		height: self.innerHeight || (document.documentElement.clientHeight || document.body.clientHeight)
	};
}

/**
 * Changes pretty much any variable into its boolean equivalent
 * Strings like yes, no, true, false, y, n
 * Numbers like 0, 1, 2...
 * @return bool
 */
function bool(arg) {
	// Returns true or false
	// Does everything concievable to make arg into a boolean value
	if (typeof(arg) == 'undefined') return false;
	switch(arg.toLowerCase()) {
		case 'yes':
		case 'true':
		case 'y':
			return true;
		break;
		case 'false':
		case 'no':
		case 'n':
			return false;
		break;
		default:
			if (arg === true) return true;
			if (arg === false) return false;
			if (parseInt(arg) > 0) return true;
			if (parseInt(arg) == 0) return false;
		break;
	}
	return null; // Inconclusive
}

/**
 * Converts a UNIX timestamp into a JS Date object
 */
function unixToDate(unixtime) {
	var time = new Date();
	time.setTime(unixtime*1000);
	return time;
}

/**
 * Sets a form input element to the given value.
 * Intuitively handles non-text input types such as
 * selects, checkboxes, radio buttons.
 */
function setValue(inputElement, newValue) {
	switch(inputElement.type) {
		case 'text':
		case 'password':
			inputElement.value = newValue;
		break;
		case 'select':
		case 'select-one':
			for (var x=0; x<inputElement.options.length; x++) {
				if (inputElement.options[x].value == newValue) inputElement.selectedIndex = x;
			}
		break;
		case 'checkbox':
			inputElement.checked = bool(newValue);
		break;
		default:
			alert('setValue() can\'t yet handle input type: '+inputElement.type);
		break;
	}
}

function getValue(inputElement) {
	switch(inputElement.type) {
		case 'text':
		case 'password':
			return inputElement.value;
		break;
		case 'select':
		case 'select-one':
			return inputElement.options[inputElement.selectedIndex].value;
		break;
		case 'checkbox':
			return bool(inputElement.checked);
		break;
		default:
			alert('getValue() can\'t yet handle input type: '+inputElement.type);
		break;
	}
}