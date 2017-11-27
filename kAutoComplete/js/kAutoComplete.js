function kAutoComplete(field, dropdown) {
	/*
	 * kAutoComplete
	 * By Kramer
	 * 051219 - 060706
	 *
	 * @see Scriptaculous
	 * @see Prototype.js
	 * @see prototype_ss.js
	 *
	 * TODO: Modernize.
	 *       Use lambda functions for ajaxin.
	 *       Track nodes/words/etc in compound objects
	 *
	 * @param field The text field to turn into an autocompleter
	 * @param dropdown OPTIONAL UL to use as a suggestion container instead of building one
	 */

	this.s_field               = field;
	this.s_ajaxUrl             = null;                                       // URL at which to access the AJAX XML file
	this.s_zIndexCorrection    = (document.all);                             // Will we need an iFrame backer to fix MSIE's selectbox z-index bug?
	this.s_delayBeforeRetrieve = 10;                                         // MS delay in user's typing before AJAX begins
	this.n_dropdown            = null;
	this.n_iframe              = null;
	this.o_ajax                = null;                                       // AJAX object holder
	this.t_suggest             = null;
	this.highlighted           = null;
	this.words                 = Array();
	this.hasEnterSubmit        = false;                                      // Does the input element have the entersubmit system running on it?
	this.manualDropdown        = false;
	if (dropdown) {
		this.n_dropdown = dropdown;
		this.manualDropdown = true;
	}

	this.constructor = function() {
		if (!this.s_field.nodeType) this.error('Field is not valid: '+this.s_field);
		this.s_ajaxUrl = this.s_field.getAttribute('src');
		this.hasEnterSubmit = Element.hasClassName(this.s_field, 'entersubmit');
		this.s_field.setAttribute('autocomplete', 'off');
		inputSize = Element.getDimensions(this.s_field);                       // How big is the input, pixelwise?

		Event.observe(this.s_field,'keydown', this.fieldChanged.bind(this));  // Add an onKeyPress handler to the input field
		Event.observe(this.s_field,'blur', this.fieldBlur.bind(this));        // Add an onBlur handler to the input field (timeout allows dropdown:onclick to do its work before this event takes over.
		//Event.observe(this.s_field,'focus', this.fieldFocus.bind(this));    // Add an onFocus handler to the input field

		if (!this.manualDropdown) {
			// Create a new UL, display: none; positioned under the input (autocomplete dropdown)
			inputLocation               = Position.cumulativeOffset(this.s_field); // Figure out where the input is.
			dropdown                    = document.createElement('ul');
			dropdown.style.width        = inputSize['width']+'px';
			dropdown.style.left         = inputLocation[0]+'px';
			dropdown.style.top          = parseInt(inputLocation[1]+inputSize['height'])+'px';
			dropdown.style.zIndex       = 100;
			Element.addClassName(dropdown,'kAutoComplete');
			this.n_dropdown = this.s_field.parentNode.appendChild(dropdown);

			if (this.s_zIndexCorrection) {                                         // If z-index correction is needed for MSIE
				// Insert an iFrame backer into the document
				iframe                    = document.createElement('iframe');
				iframe.setAttribute('href', 'javascript:void(0);');
				iframe.style.scrolling    = 'no';
				iframe.style.position     = 'absolute';
				iframe.style.frameborder  = '0';
				iframe.style.zIndex       = this.n_dropdown.style.zIndex-1;
				iframe.style.display      = 'none';
				this.n_iframe             = this.s_field.parentNode.appendChild(iframe);
			}
		}
	}

	/**
	 * Synchronizes the iFrame size and position with the dropdown
	 */
	this.iframeSync = function() {
		if (!this.manualDropdown && this.s_zIndexCorrection) {
			ddLocation = Position.cumulativeOffset(this.n_dropdown);
			ddSize     = Element.getDimensions(this.n_dropdown);
			this.n_iframe.style.left = ddLocation[0];
			this.n_iframe.style.top = ddLocation[1];
			this.n_iframe.style.height = ddSize['height']+'px';
			this.n_iframe.style.width = ddSize['width']+'px';
		}
	}

	this.hideDropdown = function() {
		if (!this.manualDropdown) {
			if (this.hasEnterSubmit) Element.addClassName(this.s_field, 'entersubmit');
			this.dropdownVisible = false;
			this.highlighted = null;
			if (this.s_zIndexCorrection) this.n_iframe.style.display = 'none';
			this.n_dropdown.style.display = 'none';
		}
	}
	this.showDropdown = function() {
		if (!this.manualDropdown) {
			if (this.hasEnterSubmit) Element.removeClassName(this.s_field, 'entersubmit');
			this.n_dropdown.style.display = 'block';
			this.iframeSync();
			if (this.s_zIndexCorrection) this.n_iframe.style.display = 'block';
			this.dropdownVisible = true;
		}
	}
	this.moveHighlight = function(newOffset) {
		if (!this.manualDropdown) {
			// newOffset can be relative if prefixed with a +/-
			//this.suggest();
			if (true || this.dropdownVisible) {
				if (this.highlighted !== null) {
					switch (newOffset.toString().charAt(0)) {
						case '+':
							var val = parseInt(newOffset.substr(1));
							this.highlighted += val;
						break;
						case '-':
							var val = parseInt(newOffset.substr(1));
							this.highlighted -= val;
						break;
						default:
							this.highlighted = newOffset;
						break;
					}
				} else {
					this.highlighted = 0;
				}
				var lis = this.n_dropdown.getElementsByTagName('li');
				this.highlighted = Math.min(lis.length-1, Math.max(this.highlighted, 0));
				for (var x=0; x<lis.length; x++) {
					if (x == this.highlighted) {
						// Selected
						Element.addClassName(lis[x], 'highlight');
					} else {
						// Unselected
						Element.removeClassName(lis[x], 'highlight');
					}
				}
			}
		}
	}

	this.fieldBlur = function(e) {
		// OnBlur of the text field
		if (!this.manualDropdown) {
			setTimeout(this.hideDropdown.bind(this), 500);                 // Hide the autocomplete dropdown
		}
	}
	this.fieldFocus = function(e) {
		// OnFocus of the text field
		if (!this.manualDropdown) {
			if (this.s_field.value.length > 0) {                              // If the text field has text in it...
				this.n_dropdown.style.display = 'block';                        // Show the autocomplete dropdown
			}
		}
	}

	this.fieldChanged = function(eventObject) {
		if (this.t_suggest) clearTimeout(this.t_suggest);
		this.t_suggest = null;
		var keycode = null;
		if (typeof(eventObject) != 'undefined') var try1 = eventObject.keyCode;
		if (typeof(eventObject) != 'undefined') var try2 = eventObject.which;
		if (typeof(event) != 'undefined') var try3 = event.keyCode;
		if (parseInt(try1) > 0) keycode = try1;
		if (parseInt(try2) > 0) keycode = try2;
		if (parseInt(try3) > 0) keycode = try3;

		switch (keycode) {
			case 0:  // Error/escape
				debug('Error, or escape pressed');
			break;
			case 40: // Down
				this.moveHighlight('+1');
			break;
			case 38: // Up
				this.moveHighlight('-1');
			break;
			case 13: // Enter
				if (this.highlighted !== null) {
					var lis = this.n_dropdown.getElementsByTagName('li');
					this.selectSuggestion(lis[this.highlighted]);
				}
			break;
			default:
				this.t_suggest = setTimeout(this.suggest.bind(this), this.s_delayBeforeRetrieve);
			break;
		}
	}

	this.suggest = function() {
		// Handles the onKeyPress event for the input field
		this.patience(true);
		word = this.s_field.value;
		this.o_ajax = new Ajax.Request(this.s_ajaxUrl, {
			method: 'get',
			parameters: 'word='+word,
			onComplete: this.showSuggestions.bind(this)
		});
		return true;
	}

	this.showSuggestions = function(e) {
		// INCOMING AJAX
		if (!this.manualDropdown) {
			this.n_dropdown.innerHTML = '';                                  // Clear the dropdown
		}
		this.patience(false);

		// Parse the XML
		this.words = new Array();
		var words = e.responseXML.getElementsByTagName('word');
		var word = null;
		for (i=0; i < words.length; i++) {
			word = words[i].firstChild.nodeValue;
			this.words.push(word);
			this.addToDropdown(word);
		}

		if (words.length) {
			this.words = words;
			this.showDropdown();
		} else {
			this.hideDropdown();
		}
	}

	this.patience = function(on) {
		if (on) {
			Element.addClassName(this.s_field,'pleaseWait');             // Turn off the AJAX-in-operation indicator
		} else {
			Element.removeClassName(this.s_field,'pleaseWait');             // Turn off the AJAX-in-operation indicator
		}
	}

	this.addToDropdown = function(word) {
		newLI = document.createElement('li');
		newLI.innerHTML = word;
		xnewLI = this.n_dropdown.appendChild(newLI);
		if (!this.manualDropdown) {
			Event.observe(newLI, 'click', this.selectSuggestion.bind(this));
			Event.observe(newLI, 'mouseover', this.mouseover.bind(this));
		}
	}
	this.mouseover = function(eventObject) {
		var which = Event.findElement(eventObject,'li');
		var lis = this.n_dropdown.getElementsByTagName('li');
		var offset = null;
		for (var x=0; x<lis.length; x++) {
			if (lis[x] == which) this.moveHighlight(x);
		}
	}

	/**
	 * e can either be an event object representing the LI element to select,
	 * or the LI element itself
	 */
	this.selectSuggestion = function(e) {                               // Callback for user's selection of an autocomplete suggestion
		//this.n_dropdown.style.display = 'none';                           // Hide the dropdown
		this.hideDropdown();
		if (typeof(e.tagName) != 'undefined') {                           // Argument is an element
			which = e;
		} else {                                                          // Argument is an event
			which = Event.findElement(e,'li');
		}
		this.s_field.value = which.innerHTML.unescapeHTML();              // Change the input field to contain their selection
	}

	String.prototype.replaceAll = function(find,replace) {
		// Acts as a simple string replace, since JavaScript doesn't have one.
		str = this;
		if (find != replace) {
			while (str.indexOf(find) > -1) {
				str = str.replace(find,replace);
			}
		}
		return str;
	}

	Array.prototype.deleteEmpty = function() {
		// Deletes empty entries from a given array
		newIndex = 0;
		newArray = new Array();
		for (i=0; i<this.length; i++) {
			if (this[i].length > 0) {
				newArray[newIndex] = this[i];
				newIndex++;
			}
		}
		return newArray;
	}

	this.error = function(text) {
		debug('kAutoComplete Error: '+text);
	}

	this.constructor();
}

Behaviour.register({
	'input.kAutoComplete': function(el) {
		new kAutoComplete(el);
	}
});