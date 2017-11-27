/**
 * kAccordion
 * By Kramer 051207
 *
 * Converts properly-formatted element clusters into accordion-style
 * click-to-reveal content zones.
 *
 * Basically the same as that provided by Rico,
 * (http://openrico.org/rico/demos.page?demo=ricoAccordion.html)
 * ...except that this one is lightweight and uses inertial resizing
 * for pleasing aesthetic.
 *
 * @see Prototype.js
 * @see document.getElementsBySelector.js
 *
 * @param elRoot      DOMELEMENT  The element which forms the outermost container for the accordion.
 * @param selHeading  CSSSELECTOR A CSS selector (global in scope) which describes
 *                                the elements which will be used as headings in the
 *                                accordion.  It's important to note that, while the CSS
 *                                selector is global in scope, meaning that it selects from
 *                                the document node, the nodes which are selected by it will
 *                                be filtered to only include those which are descendants of
 *                                "elRoot" (above)
 *
 *                                Due to Internet Explorer's event handling issues, the element
 *                                which is selected by this selector must be the same tag name
 *                                every time.  In other words, you can't make your selector
 *                                ".heading" and then use an H2.heading as one heading and an
 *                                H3.heading as another.  If you did so, then the accordion
 *                                script will choose just one of the selected tags
 *                                and use that as its clickable heading and ignore the rest.
 */
function kAccordion(s) {
	this.settings       = s;
	this.s = {
		elRoot: null,
		selHeading: null,
		canCloseAll: true,                                               // If true, clicking an open fold will close it
		canOpenAll: false,                                               // If true, no folds will auto-close.
		speedLimit: 35,                                                  // How many pixels per DELAY that folds should transition, maximum
		delay: 1                                                         // Number of miliseconds to delay between resize iterations
	};
	this.headings       = Array();
	this.contents       = Array();
	this.contentshtml   = Array();
	this.heights        = Array();                                     // Measured 100% height of a fold
	this.curHeights     = Array();                                     // Current height of a fold
	this.selected       = Array();
	this.interval       = null;
	this.headingTag     = null;
	this.needHeightSync = true;
	this.eventLog       = Array();
	this.errors         = Array();
	for (var key in s) this.s[key] = s[key];                           // Import settings

	this.canCloseAll = function(bool) {
		this.s.canCloseAll = bool;
	}
	this.canOpenAll = function(bool) {
		this.s.canOpenAll = bool;
	}
	this.speedLimit = function(newSpeed) {
		this.s.speedLimit = newSpeed;
	}
	this.delay = function(newDelay) {
		this.s.delay = newDelay;
	}

	this.construct = function() {
		var content = null;
		var allHeadings = null;
		if (!Element.hasClassName(this.s.elRoot, 'accordionProcessed')) {
			// Find all headings and content areas within this rootelement
			allHeadings = document.getElementsBySelector(this.s.selHeading);   // First find all selector-matched headings

			for (var headingCount=0; headingCount<allHeadings.length; headingCount++) {                           // Looping through each heading...
				if (DOM.isDescendant(this.s.elRoot, allHeadings[headingCount])) {        // If this heading is a descendant of the given rootElement...
					this.headings.push(allHeadings[headingCount]);                          // Save it.
					this.headingTag = allHeadings[headingCount].tagName;
					content = this.getContentElement(allHeadings[headingCount]);
					if (content.tagName == 'FIELDSET' &&                         // If the container is a fieldset,
							this.hasBugNumber261037()) {                             // and the useragent is affected by the overflow:hidden bug...
						newdiv = document.createElement('div');                    // Create a new DIV
						var displayAttribute = content.style.display;              // Steal the FIELDSET's display attribute
						content.style.display = 'block';
						newdiv.style.display = displayAttribute;                   // Give the display attribute to the new DIV
						contentCopy = content.cloneNode(true);                     // Copy the existing fieldset
						newdiv.appendChild(contentCopy);                           // Insert that copy into the new DIV
						content.parentNode.replaceChild(newdiv, content);          // Replace the original fieldset with the new DIV
						content = newdiv;                                          // Save the replacement element's reference for future use
					}
					this.heights.push(this.getHeight(content));                  // Save all of the content-areas' heights, to use when they're expanded.
					content.style.overflow = 'hidden';                           // Force overflow: hidden on the content area, as it's a rather shoddy accordion without this attribute.
					this.contents.push(content);                                 // Save it's corresponding content area too
					Event.observe(allHeadings[headingCount], 'click', this.headingClick.bind(this)); // Give it a click event
					if (content.style.display != 'none') {                       // If this heading is marked as selected in the HTML...
						this.selected.push(content);
					}
				}
			}
			if (this.headings.length > 0 && this.contents.length > 0) {      // If a sufficient number of headings and contents were found...
				Element.addClassName(this.s.elRoot, 'accordionProcessed');  // Mark this element as processed, so that future accordion class searches don't try to attach to it.
			} else {
				return false;
			}
			this.recalculateHeights();                                       // Learn the heights of the folds
			this.quickCollapse = true;                                       // Inform setNewFold() that it needs to do a quickCollapse on the next call.  This setting resets after each collapse.
			this.setNewFold();                                               // Collapse all contents but the selected one
			return true;
		} else {
			this.error('This object has already been processed by Accordion.');
			return false;
		}
	}

	this.headingClick = function(e) {
		this.killTimer();                                                  // Clear any intervals that may still be in the proces of resizing folds
		clickedHeading = Event.findElement(e, this.headingTag);                // Determine which heading was clicked
		affectedContent = this.getContentElement(clickedHeading);          // Determine which fold is affected by that heading

		// The following logic determines which folds to open and which to close,
		// and marks them accordingly for this.setNewFold() to act on.
		if (this.selected.inArray(affectedContent) != -1) {                // If this one is already selected...
			if (this.selected.length == 1) {                                 // ...and it's the only one...
				if (this.s.canCloseAll)	this.selected = new Array();           // ...then close all, IF preferences allow us to.
			} else {                                                         // If others are selected as well...
				this.selected = this.selected.deleteVals(affectedContent);     // ...then go ahead and close this one.
			}
		} else {                                                           // If this one is NOT already selected...
			if (!this.s.canOpenAll) this.selected = new Array();             // first clear all selected folds, then...
			this.selected.push(affectedContent);                             // Make it so.
		}
		this.setNewFold();                                                 // Act on the determinations made above.
	}

	this.error = function(text) {
		this.errors.push(text);
	}

	this.recalculateHeights = function() {
		var dl = '';
		for (i=0; i<this.contents.length; i++) {                           // Looping through all accordion folds...
			dl += i+') '+this.heights[i]+' / '+this.curHeights[i]+' - ';
			this.measureHeight(i);
			dl += this.heights[i]+' / '+this.curHeights[i]+'\n';
		}
		//debug(dl);
		this.changeFold();
	}

	this.measureHeight = function(whichFold) {
		var currentDisplay = this.contents[whichFold].style.display;
		var currentHeight = this.contents[whichFold].style.height;
		this.contents[whichFold].style.display = 'block';
		this.contents[whichFold].style.height = 'auto';
		var currentSize = Element.getDimensions(this.contents[whichFold]);
		this.contents[whichFold].style.display = currentDisplay;
		this.contents[whichFold].style.height = currentHeight;
		var currentWidth = currentSize['width'];
		var clonedFold = this.contents[whichFold].cloneNode(true);
		clonedFold.style.left = '-9000px';
		clonedFold.style.display = 'block';
		clonedFold.style.position = 'absolute';
		clonedFold.style.width = currentWidth+'px';
		clonedFold.style.height = 'auto';
		clonedFold = this.contents[whichFold].parentNode.insertBefore(clonedFold, this.contents[whichFold]);
		currentSize = Element.getDimensions(clonedFold);
		this.heights[whichFold] = currentSize['height'];
		clonedFold.parentNode.removeChild(clonedFold);
		this.curHeights[whichFold] = (currentDisplay == 'none') ? 0 : currentSize['height'];
	}

	this.setNewFold = function() {
		for (i=0; i<this.contents.length; i++) {                           // Looping through all headings...
			if (this.selected.inArray(this.contents[i]) != -1) {             // This is the heading which was selected
				Element.addClassName(this.headings[i], 'selected');            // Make it selected
			} else {                                                         // This is not clicked, should be hidden
				Element.removeClassName(this.headings[i], 'selected');         // Make it unselected
			}
		}
		return this.changeFold();                                          // Start the iterative process to shrinking open folds and opening the candidate fold
	}

	/**
	 * Collapses all folds except the selected one, if any.
	 */
	this.changeFold = function() {
		var needsMore = false;                                             // Bool to indicate if the interval should be cleared yet
		for (i=0; i<this.contents.length; i++) {                           // Looping through all headings...
			var display = this.contents[i].style.display;
			var grow = (this.selected.inArray(this.contents[i]) != -1);
			if (display == 'none') if (grow) this.contents[i].style.display = 'block';
			if (this.quickCollapse) {
				if (grow) {
					var newHeight = 'auto';
					this.curHeights[i] = this.heights[i];
				} else {
					var newHeight = 0;
					this.curHeights[i] = 0;
				}
			} else {
				var distanceLeft = (grow) ? this.heights[i] - this.curHeights[i] : this.curHeights[i];
				var thisIncrement = Math.min(this.s.speedLimit, (distanceLeft * .3));
				if (thisIncrement < 2) {
					thisIncrement = distanceLeft;                                // So small, just get it over with.
				}
				this.curHeights[i] = (grow) ? this.curHeights[i] + thisIncrement : this.curHeights[i] - thisIncrement;
				if (this.curHeights[i] == this.heights[i]) newHeight = 'auto';
				if (this.curHeights[i] == 0) this.contents[i].style.display = 'none';
				if (!needsMore) needsMore = (grow) ? (this.curHeights[i] < this.heights[i]) : (this.curHeights[i] > 0);
				newHeight = this.curHeights[i];
			}
			this.contents[i].style.height = (newHeight == 'auto') ? newHeight : newHeight+'px';
		}
		if (!needsMore || this.quickCollapse) {
			// Stop iterating, your job is done.
			this.quickCollapse = false;
			this.killTimer();
		} else {
			// There's more to do, set a timer to do it.
			if (!this.interval) this.interval = setInterval(this.changeFold.bind(this), this.s.delay);
		}
	}

	this.logWrite = function(text) {
		this.eventLog.push(text);
	}

	this.getContentElement = function(headingElement) {
		Element.cleanWhitespace(headingElement);                           // Simplify node traversal
		// Since cleanWhitespace() (above) doesn't do a darn thing for some reason,
		// we have to do its job here manually.
		var content = headingElement.nextSibling;
		while (content.nodeType != 1) {
			content = content.nextSibling;
		}
		return content;
	}

	this.getHeight = function(element) {
		return element.style.height;
		dims = Element.getDimensions(element);
		return dims['height'];
	}

	this.killTimer = function() {
		clearInterval(this.interval);
		this.interval = null;
	}

	this.hasBugNumber261037 = function() {
		// Returns true if the browser uses the Gecko engine
		// and is affected by bug #261037
		// see: https://bugzilla.mozilla.org/show_bug.cgi?id=261037
		// This function will assume that the useragent is NOT affected by the
		// bug, if it's Gecko build is greater than that specified in "bugFixed", below.
		bugFixed = 20061101;                                    // Date by which we expect the bug to be fixed.  Be pessimistic.
		regexp = / Gecko\/(\d*) /;
		matches = regexp.exec(navigator.userAgent);
		if (matches) {
			if (matches[1] < bugFixed) {                          // If the browser was built before this date...
				return true;
			}
		}
		return false;
	}

	return this.construct();
}