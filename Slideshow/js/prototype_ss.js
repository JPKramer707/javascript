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
Element.manipulateClass = function(element, className, doWhat) {
	var cNames = element.className.split(' ');
	if (doWhat == 'remove') {
		cNames = cNames.deleteVals(className)
	} else {
		for (var x=0; x<cNames.length; x++) {
			if (cNames[x] == className) return (doWhat == 'find');
		}
	}
	if (doWhat == 'add') cNames.push(className);
	if (doWhat == 'add' || doWhat == 'remove') element.className = cNames.join(' ');
	if (doWhat == 'find') return false;
}
/**
 * Returns the keycode related to an event, browser-independent
 */
Object.extend(Event, {
	keyCode: function(event) {
		return Math.max(event.which, event.keyCode);
	}
});

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

/* Object Extentions
-------------------------*/
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


/**
 * Kramer's DOM Library
 * DOM manipulation functions
 * March 28, 2006
 */
var DOM = {
	empty: function(el) {
		// Destructive
		// Removes all children of the given element
		while (el.hasChildNodes()) {
			el.removeChild(el.firstChild);
		}
	},

	/**
	 * Get Children By Tag Name
	 * Returns immediate children by tag name
	 * Differs from getElementsByTagName() in that this version is not recursive.
	 * @param   DOMELEMENT element which element to start on
	 * @param   STRING     tagName the name of the tags to grab
	 * @return  array of applicable elements
	 */
	getChildrenByTagName: function(element, tagName) {
		var retval = Array();
		var descendants = element.getElementsByTagName(tagName);
		for (var i=0; i<descendants.length; i++) {
			if (descendants[i].parentNode == element) {
				retval.push(descendants[i]);
			}
		}
		return retval;
	},

	/**
	 * Returns true if argument is a DOM node
	 */
	isNode: function(node) {
		if (!node) return false;
		return (typeof(node.nodeType) != 'undefined');
	},

	/**
	 * Get Element Text NS
	 * retrieve text of an XML document element, including
	 * elements using namespaces
	 */
	getElementTextNS: function(prefix, local, parentElem, index) {
		var result = "";
		if (prefix && document.all) {
			// IE/Windows way of handling namespaces
			result = parentElem.getElementsByTagName(prefix + ":" + local)[index];
		} else {
			result = parentElem.getElementsByTagName(local)[index];
		}
		if (result) {
			// get text, accounting for possible
			// whitespace (carriage return) text nodes
			if (result.childNodes.length > 1) {
				return result.childNodes[1].nodeValue;
			} else {
				return result.firstChild.nodeValue;
			}
		} else {
			return null;
		}
	},

	getElementText: function(el) {
		// Seeks out the first text element node contained in el and returns it
		if (typeof(el) != 'undefined' && typeof(el.childNodes) != 'undefined') {
			var nodeTypes = [3,4];                                         // Node types to check for data
			var nodes = {};
			for (var x=0; x<nodeTypes.length; x++) {
				nodes[nodeTypes[x]] = [];
			}
			for (var x=0; x<el.childNodes.length; x++) {
				if (nodeTypes.inArray(el.childNodes[x].nodeType) != -1) {
					nodes[el.childNodes[x].nodeType].push(el.childNodes[x]);
				}
			}
			if (nodes[4].length > 0) return nodes[4][0].nodeValue;
			if (nodes[3].length > 0) return nodes[3][0].nodeValue;
		}
		return false;
	},

	nodeDisplayValue: function(node, replacementValue) {
		// Uses simple logic to drill down into a DOM node element in
		// search of the numeric value it is trying to display to the user,
		// and to return that value in float form.
		// If replacementValue is set, then, once the value has been
		// located; it will be replaced with that value.
		var replace = (typeof(replacementValue) != 'undefined');

		if (DOM.isNode(node)) {
			var value = null;
			switch (node.tagName.toLowerCase()) {
				case 'input':
					if (replace) node.value = replacementValue;
					value = node.value;
				break;
				default:
					// Place transition code here if desired.
					if (replace) node.childNodes[0].nodeValue = replacementValue;
					value = node.childNodes[0].nodeValue;
				break;
			}
			value = this.parseNumber(value);
			if (isNaN(value)) return 0;
			return value;
		} else {
			return false;
		}
	},

	/**
	 * Reads in style from style sheets based on a given selector
	 * IE ONLY for now. Should be adaptable to real browsers eventually.
	 */
	getClassStyle: function(selector) {
		var cssRules = (document.all) ? 'rules' : 'cssRules';

		for (var sheet=0; sheet<document.styleSheets.length; sheet++){
			for (var importNo=0; importNo<document.styleSheets[sheet].imports.length; importNo++) {
				var thisImport = document.styleSheets[sheet].imports[importNo];
				var rules = thisImport[cssRules];
				for (var rule=0; rule<rules.length; rule++) {
					if (typeof(rules[rule].selectorText)) {
						if (rules[rule].selectorText == selector) {
							return rules[rule].style;
						}
					}
				}
			}
		}
		return false;
	},

	replace: function(originalNode, newNode) {
		if (typeof(newNode) == 'string') newNode = document.createTextNode(newNode);
		return originalNode.parentNode.replaceChild(newNode, originalNode);
	},

	findFlag: function(flagText, within) {
		// Locates a comment with particular text in a document.
		// Optionally searches only within a given node.
		if (!within) within = document.getElementsByTagName('body')[0];
		var list = within.childNodes;
		for (var x=0; x<list.length; x++) {
			if (list[x].nodeType == 8 && list[x].nodeValue == flagText) return list[x];
			if (list[x].childNodes.length) {
				var recursionResult = DOM.findFlag(flagText, list[x]);
				if (recursionResult != false) return recursionResult;
			}
		}
		return false;
	},

	getCommentData: function(flagText, within) {
		if (!within) within = document.getElementsByTagName('body')[0];
		var list = within.childNodes;
		for (var x=0; x<list.length; x++) {
			if (list[x].nodeType == 8) {
				var statements = list[x].nodeValue.split(';');
				for (var y=0; y<statements.length; y++) {
					var chunks = statements[y].split('=');
					var keyName = chunks[0].trim();
					if (keyName == flagText) {
						return chunks[1].trim();
					}
				}
			}
			if (list[x].childNodes.length) {
				var recursionResult = DOM.getCommentData(flagText, list[x]);
				if (recursionResult != false && recursionResult != null) return recursionResult;
			}
		}
	},

	isDescendant: function(rootNode, childNode) {
		// Returns true if childNode is a descendant of rootNode
		var context = childNode;
		while (!(context.nodeType == 1 && context.tagName == 'BODY')) {
			context = context.parentNode;
			if (context == null) return false;
			if (context == rootNode) return true;
		}
		return false;
	},

	getAncestorsByTagName: function(startNode, tagName) {
		var ancestors = [];
		while (startNode != document.documentElement) {
			startNode = startNode.parentNode;
			if (startNode.tagName.toLowerCase() == tagName.toLowerCase()) ancestors.push(startNode);
		}
		return ancestors;
	},

	insertChild: function(newNode, refNode) {
		// Inserts a child element as first child, not last like appendChild does
		if (refNode.firstChild) {
			newNode = refNode.insertBefore(newNode, refNode.firstChild);
		} else {
			newNode = refNode.appendChild(newNode);
		}
		return newNode;
	},

	cut: function(node) {
		// Removes the given node from the DOM and returns it
		var clone = node.cloneNode(true);
		DOM.remove(node);
		return clone;
	},

	insertAfter: function(newNode, refNode) {
		// Acts like insertBefore, but does so after refNode.
		if (refNode.nextSibling) {
			newNode = refNode.parentNode.insertBefore(newNode, refNode.nextSibling);
		} else {
			newNode = refNode.parentNode.appendChild(newNode);
		}
		return newNode;
	},

	remove: function(node) {
		if (node.parentNode) return node.parentNode.removeChild(node);
	},

	/**
	 * Takes a DOM node and returns an HTML representation of it.
	 * (Not the exact tag as written in the HTML, necessarily)
	 */
	showTag: function(el, contents) {
		var tag = '';
		var att = null;
		var val = null;
		if (el) {
			if (el.nodeType == 1) {
				var tagName = el.tagName.toLowerCase();
				tag = "<"+tagName;
				if (el.attributes) {
					for (var i=0; i<el.attributes.length; i++) {
						att = el.attributes[i].nodeName;
						val = el.attributes[i].nodeValue;
						if (val) tag += ' '+att+'="'+val+'"';
					}
				}
				var innerHTML = (typeof(el.innerHTML) == 'unknown') ? '**innerHTML property undefined**' : el.innerHTML;
				if (contents && innerHTML) {
					tag += '>';
					tag += innerHTML;
					tag += '</'+tagName+'>';
				} else {
					tag += ' />';
				}
			} else {
				tag = 'Invalid node type: '+el.nodeType;
			}
		} else {
			tag = 'Parameter is not a tag node: '+el;
		}
		return tag;
	},
	makeTag: function(el, deep) {
		return DOM.showTag(el, deep);
	},

	/**
	 * Shows the style of a given element
	 */
	showStyle: function(el) {
		if (el) {
			st = "Element Style: <"+el.tagName+">\n\n";
			if (el.style) {
				for (afds in el.style) {
					val = el.style[afds];
					if (val && typeof(val) != 'function') st += afds+': "'+el.style[afds]+'"\n';
				}
			} else {
				st = 'No style';
			}
		} else {
			st = 'Parameter is not an element: '+el;
		}
		return st;
	}
};

/**
 * Kramer's debugging library
 * 060515
 */
var Debug = {
	makeObject: function(obj) {
		var txt = '';
		for (var key in obj) {
			switch(typeof(obj[key])) {
				case 'function':
				break;
			}
			if (typeof(obj[key]) == 'object') {
				txt += key+' = {\n';
				//txt += Debug.makeObject(obj[key]);
				txt += '}\n';
			} else {
				txt += key+' = '+obj[key]+'\n';
			}
		}
		return txt;
	}
}

function bool(arg) {
	// Returns true or false
	// Does everything concievable to make arg into a boolean value
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
