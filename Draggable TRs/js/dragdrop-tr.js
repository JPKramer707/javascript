// This patch was made for:
// script.aculo.us dragdrop.js v1.6.4, Wed Sep 06 11:30:58 CEST 2006
// Currently only works with ghosting turned on.
Draggable.prototype.initialize = function(element) {
	var defaults = {
		handle: false,
		reverteffect: function(element, top_offset, left_offset) {
			var dur = Math.sqrt(Math.abs(top_offset^2)+Math.abs(left_offset^2))*0.02;
			new Effect.Move(element, { x: -left_offset, y: -top_offset, duration: dur,
				queue: {scope:'_draggable', position:'end'}
			});
		},
		endeffect: function(element) {
			var toOpacity = typeof element._opacity == 'number' ? element._opacity : 1.0;
			new Effect.Opacity(element, {duration:0.2, from:0.7, to:toOpacity,
				queue: {scope:'_draggable', position:'end'},
				afterFinish: function(){
					Draggable._dragging[element] = false
				}
			});
		},
		zindex: 1000,
		revert: false,
		scroll: false,
		scrollSensitivity: 20,
		scrollSpeed: 15,
		snap: false,  // false, or xy or [x,y] or function(x,y){ return [x,y] }
		delay: 0
	};

	if(arguments[1] && typeof arguments[1].endeffect == 'undefined')
		Object.extend(defaults, {
			starteffect: function(element) {
				element._opacity = Element.getOpacity(element);
				Draggable._dragging[element] = true;
				new Effect.Opacity(element, {duration:0.2, from:element._opacity, to:0.7});
			}
		});

	var options = Object.extend(defaults, arguments[1] || {});

	this.element = $(element);
	if (this.element.tagName == 'TR') options.trMode = true;

	if(options.handle && (typeof options.handle == 'string')) {
		var h = Element.childrenWithClassName(this.element, options.handle, true);
		if(h.length>0) this.handle = h[0];
	}
	if(!this.handle) this.handle = $(options.handle);
	if(!this.handle) this.handle = this.element;

	if(options.scroll && !options.scroll.scrollTo && !options.scroll.outerHTML) {
		options.scroll = $(options.scroll);
		this._isScrollChild = Element.childOf(this.element, options.scroll);
	}

	if (!options.trMode) Element.makePositioned(this.element); // fix IE

	this.delta    = this.currentDelta();
	this.options  = options;
	this.dragging = false;

	this.eventMouseDown = this.initDrag.bindAsEventListener(this);
	Event.observe(this.handle, "mousedown", this.eventMouseDown);

	Draggables.register(this);
};

Draggable.prototype.startDrag = function(event) {
	this.dragging = true;

	if(this.options.zindex) {
		this.originalZ = parseInt(Element.getStyle(this.element,'z-index') || 0);
		this.element.style.zIndex = this.options.zindex;
	}

	if (this.options.trMode) {
		for (var x=0; x<30; x++) {
			if (typeof(newNodes) == 'undefined') {
				var parent = this.element.parentNode;
				var newNodes = this.element.cloneNode(true);
			} else {
				var newNodes2 = newNodes.cloneNode(true);
				newNodes = cloneNode(parent)
				newNodes.appendChild(newNodes2);
				if (parent.tagName == 'TABLE') break;
				parent = parent.parentNode;
			}
		}
		this.fakeTable = parent.parentNode.insertBefore(newNodes, parent);
		this.originalElement = this.element;
		this.element = this.fakeTable;
	}

	if(this.options.ghosting) {
		if (this.options.trMode) {
			this._clone = this.fakeTable;
		} else {
			this._clone = this.element.cloneNode(true);
		}
		Position.absolutize(this.element);
		if (!this.options.trMode) this.element.parentNode.insertBefore(this._clone, this.element);
	} else {
		Element.hide(this.element);
	}

	if(this.options.scroll) {
		if (this.options.scroll == window) {
			var where = this._getWindowScroll(this.options.scroll);
			this.originalScrollLeft = where.left;
			this.originalScrollTop = where.top;
		} else {
			this.originalScrollLeft = this.options.scroll.scrollLeft;
			this.originalScrollTop = this.options.scroll.scrollTop;
		}
	}

	Draggables.notify('onStart', this, event);

	if(this.options.starteffect) this.options.starteffect(this.element);
};

Draggable.prototype.finishDrag = function(event, success) {
	this.dragging = false;

	if(this.options.ghosting) {
		Position.relativize(this.element);
		Element.remove(this._clone);
		this._clone = null;
	}

	if(success) Droppables.fire(event, this.element);
	Draggables.notify('onEnd', this, event);

	var revert = this.options.revert;
	if(revert && typeof revert == 'function') revert = revert(this.element);

	var d = this.currentDelta();
	if(revert && this.options.reverteffect) {
		this.options.reverteffect(this.element,
			d[1]-this.delta[1], d[0]-this.delta[0]);
	} else {
		this.delta = d;
	}

	if(this.options.zindex)
		this.element.style.zIndex = this.originalZ;

	if(this.options.endeffect)
		this.options.endeffect(this.element);

	Draggables.deactivate(this);
	Droppables.reset();

	if (this.options.trMode) {
		Element.remove(this.fakeTable);
		this.element = this.originalElement;
	}
};


function cloneNode(node) {
	var newNode = document.createElement(node.tagName);
	var classes = node.className.split(' ');
	for (var x=0; x<classes.length; x++) Element.addClassName(newNode, classes[x]);
	return newNode;
}

/**
 * Takes a DOM node and returns an HTML representation of it.
 * (Not the exact tag as written in the HTML, necessarily)
 */
showTag = function(el, contents) {
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
			} else if (!contents && innerHTML) {
				tag += '>';
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
};
