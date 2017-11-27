/**
 * Kramer's DOM Library
 * DOM manipulation functions
 * March 28, 2006
 */
var DOM = {
	empty: function(el) {
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

	getXMLData: function(startFrom, tagName) {
		// Gets data from inside an XML tag by name. Seeks the first tag inside of startFrom with the correct name,
		// returns the text node from inside it.
		var tags = startFrom.getElementsByTagName(tagName);
		if (tags.length) {
			return DOM.getElementText(tags[0]);
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

	/**
	 * Replaces one DOM node with another
	 */
	replace: function(originalNode, newNode) {
		if (typeof(newNode) == 'string') newNode = document.createTextNode(newNode);
		return originalNode.parentNode.replaceChild(newNode, originalNode);
	},

	/**
	 * Locates a comment with particular text in a document.
	 * Optionally searches only within a given node.
	 */
	findFlag: function(flagText, within) {
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