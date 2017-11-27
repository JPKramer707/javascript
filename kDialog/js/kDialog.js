/**
 * 060524: Updated.
 *   Uses .bind() instead of the old .closure()
 *   More robust
 *
 * Creates a cluster of DOM nodes which constitute a floating
 * shadow box, as defined in CSS.
 *
 * @see   prototype.js
 * @return          BOOL    True if the dialog was created, false if it failed (usually due to
 *                          redundancy restrictions)
 * @param settings  OBJECT  Contains many settings about the box's properties, as outlined
 *                          below.  Example:
 *															tmp = new kDialog(
 *																{
 *																	title: 'Test kDialog',
 *																	closeButton: 'Close',
 *																	draggable: true,
 *																	content: 'This is a kDialog box.',
 *																	posAnchor: 'middle center',
 *																	relativeTo: document.getElementsByTagName('h2')[1],
 *																	posx: 00,
 *																	posy: 0
 *																}
 *															);
 *																tmp.show();
 *
 * SETTINGS:
 *   NAME         DEFAULT     VALUES                DESCRIPTION
 *   -----------  ----------  --------------------  -----------------------------------------------------------------
 *   title        null        STRING                Text of the title of the kDialog.  Displayed in an H2.
 *                                                  If this box is to be draggable, this title will function as the handle.
 *   closeButton  "Close"     STRING                Text displayed next to the close button.
 *   draggable    false       BOOL                  Boolean: should we make the box draggable?
 *   content      null        STRING                HTML to display in the content area of the box.
 *   posAnchor    top left    (top|middle|bottom)   Which part of the box should we anchor to the given position coords?
 *                            (left|center|right)   Examples:
 *                                                    'top left'
 *                                                    'center right'
 *                                                    'bottom right'
 *                                                    'center middle'
 *   posx         0           INT                   Horizontal (X) coordinate to position the container at.
 *   posy         0           INT                   Vertical (Y) coordinate to position the container at.
 *   relativeTo   "document"  (see descrip)         What to position the element relative to.  Can be one of:
 *                                                   element     A node element
 *                                                   "window"    NOT YET IMPLEMENTED.  The window - scroll position dictates position of 0,0
 *                                                   "document"  The document - scroll position does not affect position
 *                                                   "pointer"   The mouse pointer's current position
 *   forceVisible true        BOOL                  Should we override any positioning rules which would put the kDialog's
 *                                                  top-left corner outside the top or left of the viewport?
 *   clearDrag    true        BOOL                  Should the kDialog become semi-transparent on drag?  If so,
 *                                                  then the "iFrame selectbox z-index" fix will unapply during drag times,
 *                                                  making selectboxes show through the semi-transparent kDialog until
 *                                                  it's dropped again.  This option is always true in non-MSIE browsers.
 *   groupID      null        ANYTHING              Any value, string/number/DOMNODE/etc that can be compared against to
 *                                                  detect whether other kDialogs of the same kind are in existence,
 *                                                  and limit their creation thereby.  If this value is left unspecified,
 *                                                  then detection of redundant kDialogs by groupID is disabled.
 *   boxID        null        ANYTHING              Same as groupID, but this one refers to the kDialog itself.
 *   groupLimit   1           INT                   How many kDialogs of this groupID will be allowed to co-exist?
 *   boxLimit     1           INT                   How many kDialogs of this boxID will be allowed to co-exist?
 *   autoShow     true        BOOL                  Should we make the box visible automatically?
 *   onMouseout   null        FUNCTION              A function to execute on mouseout
 *   onMouseover  null        FUNCTION              A function to execute on mouseover
 *   onShow       null        FUNCTION              A function to execute when the kDialog becomes visible. Receives THIS as an argument
 *   onCreate     null        FUNCTION              A function to execute after the kDialog is created and content is populated. Receives THIS as an argument
 *   className    null        STRING                Classname that should be added to the kDialog container
 *   lightBox     false       BOOL                  Should the "lightBox" go up when this dialog is made visible?
 *
 */
var GLOBAL_kDialogs = new Array();                                // Tracks kDialog instances globally, part of the redundant box protection system.
function kDialog(settings) {
	// Nodes
	this.n_container    = null;
	this.n_handle       = null;
	this.n_closeButton  = null;
	this.n_title        = null;
	this.n_titlebar     = null;
	this.n_iframe       = null;                                        // iFrame node, only used for z-index fix in MSIE
	this.n_content      = null;
	this.n_lightBox     = null;
	// Objects
	this.o_draggable    = null;
	// Settings (Default values, all of these are overridable by the instantiator)
	this.s_title        = null;
	this.s_closeButton  = 'Close';
	this.s_draggable    = true;
	this.s_content      = null;
	this.s_posAnchor    = 'top left';
	this.s_posx         = 0;
	this.s_posy         = 0;
	this.s_relativeTo   = 'document';
	this.s_needsIframe  = (document.all) ? true : false;               // Does this browser require an iFrame fix, to hide the MSIE selectbox z-index bug?
	this.s_iframeShrink = 1;                                           // Number of pixels to shrink the iFrame on all sides
	this.s_clearDrag    = true;
	this.s_groupID      = null;
	this.s_boxID        = null;
	this.s_groupLimit   = 1;
	this.s_boxLimit     = 1;
	this.s_closeOnBlur  = false;                                       // WIP TODO not implemented yet
	this.s_forceVisible = true;
	this.s_autoShow     = true;
	this.s_onMouseout   = null;
	this.s_onMouseover  = null;
	this.s_eventTriggered = null;                                      // Event, optional, supplied for positioning relative to mouse pointer
	this.s_class        = null;
	this.s_onClose      = function() {};                               // A callback executed when the box is closed.
	this.s_onShow       = function() {};                               // Callback executed when the window is shown
	this.s_onCreate     = function() {};
	this.s_className    = 'kDialog';
	this.s_zIndex       = 100;
	this.s_lightBox     = false;

	for (varname in settings) this['s_'+varname] = settings[varname];	 // Application of sent settings

	// Other
	this.homex          = null;
	this.homey          = null;
	this.posx           = this.s_posx;
	this.posy           = this.s_posy;
	this.instance       = 'test';
	this.draggableOK    = (typeof(Draggable) != 'undefined');          // If, for some reason, the Draggable object is unavailable, this will let us know GRACEFULLY
	this.events         = [];

	this.construct = function() {
		// Check for redundancy.  If blocking kDialogs are found, kill them before launching this one.
		if (blockers = this.registryBlock()) {
			for (index in blockers) {
				if (typeof(blockers[index]) != 'function') {
					blockers[index].destroy();
				}
			}
		}

		var div = document.createElement('div');
		var html = ''+
			((this.s_needsIframe) ? '<iframe href="javascript:void(0);" style="scrolling: no; position: absolute; frameborder: 0; z-index: '+(this.s_zIndex-1)+'; display: block;"></iframe>\n' : '')+
			'<div class="'+this.s_className+'" style="z-index: '+this.s_zIndex+';">'+
			'	<div class="'+this.s_className+'_right">\n'+
			'		<div class="'+this.s_className+'_content">\n'+
			'			<!--This HTML is generated by JavaScript by the kDialog class-->\n'+
			'			<div class="'+this.s_className+'_titlebar handle">\n'+
			((this.s_closeButton) ? '				<a href="javascript:void(0);" class="'+this.s_className+'_closeButton">Close</a>\n' : '')+
			((this.s_title) ? '				<h2>'+this.s_title+'</h2>\n' : '')+
			'			</div>\n'+
			'			<div class="'+this.s_className+'_content2">\n'+
			'				<!--Begin CONTENT-->\n'+
			this.s_content+
			'				<!--End CONTENT-->\n'+
			'			</div>\n'+
			'		</div>\n'+
			'	</div>\n'+
			'<!-- The following seemingly superfluous nodes permit the styling of kDialog with a drop shadow -->\n'+
			'	<div class="'+this.s_className+'_bottom_container">\n'+
			'		<div class="'+this.s_className+'_bl"></div>\n'+
			'		<div class="'+this.s_className+'_br"></div>\n'+
			'		<div class="'+this.s_className+'_bottom"></div>\n'+
			'	</div>\n';
			'</div>\n';
		div.innerHTML = html;

		this.n_container = div.getElementsByTagName('div')[0];
		if (this.s_title) {
			this.n_title = document.getElementsByClassName(this.s_className+'_titlebar', this.n_container)[0];
			this.n_handle = this.n_title;
		}
		if (this.s_needsIframe) {
			var iframes = div.getElementsByTagName('iframe');
			this.iframe = iframes[iframes.length-1];
		}
		_body = document.getElementsByTagName('body')[0];
		_body.insertBefore(div, _body.firstChild);  // INSERT INTO THE DOCUMENT

		this.hide();
		this.position();

		this.n_titlebar = document.getElementsByClassName('kDialog_titlebar', this.n_container, 'div')[0];
		this.n_title = this.n_titlebar.getElementsByTagName('h2')[0];
		this.n_content = document.getElementsByClassName('kDialog_content2', this.n_container, 'div')[0];
		//if (document.all) this.n_content = this.n_container.firstChild.firstChild.firstChild.nextSibling.nextSibling;  // Less reliable method, but the getElementsByClassName() function wasn't working in MSIE

		// Make it draggable if the user wanted it draggable
		if (this.s_draggable && this.n_titlebar && this.draggableOK) {
			draggableOptions = {
				handle: 'handle'
			}
			if (!this.s_clearDrag) {
				// If this box is not to have clearDrag enabled, then specify the callback which
				// makes the iFrame follow the kDialog.
				draggableOptions['change'] = this.duringDrag.bind(this);
			}
			this.o_draggable = new Draggable(this.n_container, draggableOptions);
			if (this.s_needsIframe) {
				if (this.s_clearDrag) {
					// Need to hide the iFrame on drag
					this.events.push(Event.observe(this.n_titlebar, 'mousedown', this.dragStart.bind(this)));
					this.events.push(Event.observe(this.n_titlebar, 'mouseup', this.dragStop.bind(this)));
				}
			}
		}

		// Assign the CLOSE BUTTON event handler
		if (this.s_closeButton) {
			this.n_closeButton = document.getElementsByClassName('kDialog_closeButton', this.n_container, 'a')[0];
			this.events.push(Event.observe(this.n_closeButton, 'click', this.destroy.bind(this)));
		}

		// Assign the CLOSE ON BLUR event handlers
		if (this.s_closeOnBlur) {           // Set up event handlers to detect a BLUR event
			// This routine makes meticulous use of the bubbling principle.
			// A click on the document tells kDialog that the box has been blurred.
			// A click on the box, which is part of the document, tells kDialog to disregard
			// this click (not to consider it a blur event) and STOPS BUBBLING so that the
			// document's click event does not end up being called and registering a false blur.
			// WIP TODO
			document.onclick = this.documentOnClick.bind(this);
			if (document.captureEvents) document.captureEvents(Event.CLICK);
			this.n_container.onclick = this.boxOnClick.bind(this);
			if (this.n_container.captureEvents) this.n_container.captureEvents(Event.CLICK);
		}
		this.register();                    // Add our record to the kDialog registry

		// Assign developer-specified onMouseout event if needed
		if (this.s_onMouseout) this.events.push(Event.observe(this.n_container, 'mouseout', this.s_onMouseout));
		if (this.s_onMouseover) this.events.push(Event.observe(this.n_container, 'mouseover', this.s_onMouseover));

		this.s_onCreate(this);
		if (this.s_autoShow) this.show();
		return this;
	}

	/**
	 * Callback for click events document-wide.
	 * If the click was outside of this kDialog, we'll call this.onBlur()
	 * WIP TODO
	 */
	this.documentOnClick = function(e) {
		debug('Clicked document');
		el = Event.handler(e, 'undefined');
		//debug(el.tagName);
	}
	this.boxOnClick = function(e) {
		debug('Clicked box');
		el = Event.handler(e, 'undefined');
		if (!e) var e = window.event;
		e.cancelBubble = true;
		if (e.stopPropagation) e.stopPropagation();
		//debug(el.tagName);
	}

	/**
	 * PUBLIC method for altering settings values
	 */
	this.set = function(key, value) {
		this['s_'+key] = value;
		switch (key) {
			case 'title':
				this.n_title.replaceChild(document.createTextNode(value), this.n_title.firstChild);
			break;
			case 'content':
				var titlebar = this.n_titlebar.cloneNode(true);
				this.n_content.innerHTML = value;
				this.position(); // In case the dimensions changed as a result, position must be recalced
			break;
			case 'posy':
				this.posy = parseInt(value);
				this.position();
			break;
			case 'posx':
				this.posx = parseInt(value);
				this.position();
			break;
			case 'posAnchor':
				this.s_posAnchor = value;
				this.position();
			break;
		}
	}

	/**
	 * Registers this kDialog with the global kDialog registry
	 */
	this.register = function() {
		GLOBAL_kDialogs.push(this);
	}

	/**
	 * Deregisters this kDialog with the global kDialog registry
	 */
	this.unregister = function() {
		GLOBAL_kDialogs = GLOBAL_kDialogs.deleteVals(this);
	}

	/**
	 * Checks the registry for pre-existing boxes.
	 * Returns false if no redundancy restrictions would be infringed by the creation of this kDialog.
	 * Returns an array of other kDialogs which block instantiation if otherwise.
	 */
	this.registryBlock = function() {
		groupRules = (this.s_groupID != null && this.s_groupLimit);
		boxRules   = (this.s_boxID   != null && this.s_boxLimit);
		if (groupRules || boxRules) {
			othersInThisGroup = new Array();
			othersOfThisType = new Array();
			for (box in GLOBAL_kDialogs) {
				if (typeof(GLOBAL_kDialogs[box]) != 'function') {
					if (this.s_groupID != null && GLOBAL_kDialogs[box].s_groupID == this.s_groupID) othersInThisGroup.push(GLOBAL_kDialogs[box]);
					if (this.s_boxID != null && GLOBAL_kDialogs[box].s_boxID == this.s_boxID) othersOfThisType.push(GLOBAL_kDialogs[box]);
				}
			}
			if (groupRules && othersInThisGroup.length < this.s_groupLimit) return false;
			if (boxRules && othersOfThisType.length < this.s_boxLimit) return false;
			blockers = othersInThisGroup.concat(othersOfThisType);
			return blockers.unique();
		}
		return false;
	}


	/**
	 * Callback for Scriptaculous' draggable "change" option
	 * Currently this is only active when fixing the MSIE
	 * "selectbox z-index" bug.
	 */
	this.duringDrag = function() {
		this.positionIframe();
	}

	/**
	 * Callback to handle the stop-dragging event
	 */
	this.dragStop = function() {
		this.positionIframe();
		this.iframe.style.display = 'block';
	}
	/**
	 * Callback to handle the start-dragging event
	 */
	this.dragStart = function() {
		this.iframe.style.display = 'none';
	}

	// Position the box according to settings
	this.position = function() {
		var pos = {
			x: this.posx,
			y: this.posy
		};

		// Find the current location of the item which we're positioning relative to
		switch(this.s_relativeTo) {
			case 'window':
				var coords = this.getScrollXY();                             // Figure out the scroll position.
				pos.x += coords.x;
				pos.y += coords.y;
			break;
			case 'pointer':                                                // Requires that an event be supplied in s_eventTriggered
				if (this.s_eventTriggered) {
					pos.x += Event.pointerX(this.s_eventTriggered);
					pos.y += Event.pointerY(this.s_eventTriggered);
				} else {
					// todo This dependency can be eliminated by using the HID class
					this.error('In order to position relative to the pointer, an event must be given in the instantiation settings.');
				}
			break;
			case 'document':
				pos.x += 0;
				pos.y += 0;
			break;
			default:
				if (typeof(this.s_relativeTo) == 'object' && typeof(this.s_relativeTo.nodeType) != 'undefined') {
					// User has specified an element to position the kDialog in relation to.
					var relativeTo = this.s_relativeTo;
					if (document.all) {                                        // MSIE can't get the position of MAP or AREA elements
						while (relativeTo.tagName == 'AREA' || relativeTo.tagName == 'MAP') {
							relativeTo = relativeTo.parentNode;
						}
					}
					var tmp = Position.cumulativeOffset(relativeTo);           // Get its coords.

					// Change the kDialog position relative to the given element's coordinates
					pos.x += tmp[0];
					pos.y += tmp[1];
				}
			break;
		}

		// Anchor according to settings
		//  Get current size of ourself
		//  Add/substract dimensions as necessary
		var ourSize = Element.getDimensions(this.n_container);

		var anchors = this.s_posAnchor.split(' ');
		if (anchors.inArray('middle') != -1) pos.y -= (ourSize['height']/2);
		if (anchors.inArray('bottom') != -1) pos.y -= ourSize['height'];
		if (anchors.inArray('center') != -1) pos.x -= (ourSize['width']/2);
		if (anchors.inArray('right') != -1)  pos.x -= ourSize['width'];

		if (this.s_forceVisible) {
			// If user requested forceVisible, then force this box into the viewport
			// Make sure width+pos.x < screen width+scroll offset
			var coords = this.getScrollXY();                               // Figure out the scroll position.
			pos.x = Math.max(pos.x, coords.x);
			pos.y = Math.max(pos.y, coords.y);
		}

		// Move to the calculated position
		this.n_container.style.top  = pos.y+'px';
		this.n_container.style.left = pos.x+'px';
		this.positionIframe();                                           // Any time the box moves, the iFrame must follow
	}

	this.positionIframe = function() {
		if (this.s_needsIframe) {                                        // If this is MSIE...
			var ourSize = Element.getDimensions(this.n_container);
			var ourPos = Position.cumulativeOffset(this.n_container);
			this.iframe.style.top = (ourPos[1] + this.s_iframeShrink)+'px';
			this.iframe.style.left = (ourPos[0] + this.s_iframeShrink)+'px';
			this.iframe.style.height = (ourSize['height'] - this.s_iframeShrink)+'px';
			this.iframe.style.width = (ourSize['width'] - this.s_iframeShrink)+'px';
		}
	}

	this.getScrollXY = function() {
		var scrOfX = 0, scrOfY = 0;
		if( typeof( window.pageYOffset ) == 'number' ) {
			//Netscape compliant
			scrOfY = window.pageYOffset;
			scrOfX = window.pageXOffset;
		} else if( document.body && ( document.body.scrollLeft || document.body.scrollTop ) ) {
			//DOM compliant
			scrOfY = document.body.scrollTop;
			scrOfX = document.body.scrollLeft;
		} else if( document.documentElement &&
				( document.documentElement.scrollLeft || document.documentElement.scrollTop ) ) {
			//IE6 standards compliant mode
			scrOfY = document.documentElement.scrollTop;
			scrOfX = document.documentElement.scrollLeft;
		}
		return {x: scrOfX, y: scrOfY};
	}

	this.hide = function() {
		if (this.s_lightBox && this.n_lightBox) {
			this.n_lightBox.parentNode.removeChild(this.n_lightBox);
			this.n_lightBox = null;
		}
		if (this.iframe) this.iframe.style.display = 'none';
		//window.defaultStatus = makeTag(this.n_container);
		if (this.n_container) this.n_container.style.display = 'none';
		//Element.hide(this.n_container);
	}
	this.show = function() {
		if (this.s_lightBox) {
			var body = document.getElementsByTagName('body')[0];
			body.style.height = '100%'; // Important for MSIE only
			var fs = document.createElement('div');
			fs.style.height = "100%";
			fs.style.width = "100%";
			fs.style.position = "absolute";
			fs.style.top = '0px';
			fs.style.left = '0px';

			Element.addClassName(fs, 'kDialog_lightBox');
			this.n_lightBox = body.appendChild(fs);
		}
		Element.show(this.n_container);
		if (this.s_needsIframe) this.iframe.style.display = 'block';
		this.s_onShow(this);
	}
	this.destroy = function() {
		this.s_onClose();
		this.hide();
		this.unregister();
		this.destruct();
	}
	this.destruct = function(e) {
		for (var x=0; x<this.events.length; x++) {
			Event.unObserve(this.events[x]);
		}
		if (this.s_draggable) this.o_draggable.destroy();
		if (this.n_container) this.n_container.parentNode.removeChild(this.n_container);
		this.n_container = null;
		if (this.iframe) {
			this.iframe.parentNode.removeChild(this.iframe);
			this.iframe = null;
		}
	}
	this.error = function(text) {
		alert('kDialog.js Says:\n\n'+text);
	}

	return this.construct();
}
