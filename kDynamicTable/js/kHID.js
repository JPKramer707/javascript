var HIDClass = Class.create();
HIDClass.prototype = {
	/**
	 * Human Interface Devices
	 *
	 * @see DOM.js
	 **/
	initialize: function(s) {
		this.settings = s;
		for (var key in s.p) this.p.s[key] = s.p[key];
		for (var key in s.k) this.k.s[key] = s.k[key];
		this.p.obj = this;
		this.k.obj = this;
		this.obj = this;

		if (this.p.s.use) {
			for (var x=0; x<this.p.s.events.length; x++) {
				Event.observe(this.p.s.attachEventsTo, this.p.s.events[x], this.p.nativeEventFire.bind(this, this.p.s.events[x]), true);
			}
		}
		if (this.k.s.use) {
			Event.observe(this.s.attachEventsTo, 'keydown',     this.k.keyDown.bind(this));
			Event.observe(this.s.attachEventsTo, 'keyup',       this.k.keyUp.bind(this));
		}
	},

	p: {                                                               // Pointer
		obj: null,
		s: {
			use: false,
			events: ['mousemove', 'mousedown', 'mouseup', 'contextmenu', 'dblclick', 'click'],
			attachEventsTo: document,
			assumeUpAfter: 100
		},
		x: false,
		y: false,
		down: {
			l: false,
			m: false,
			r: false
		},
		downPosition: {
			l: false,
			m: false,
			r: false
		},
		upPosition: {
			l: false,
			m: false,
			r: false
		},
		clickDistance: 10,                                               // A "click" ceases to be a "click" if the mouse travels this distance between mousedown and mouseup
		events: [],

		getPos: function() {                                             // gets current pixel position
			return {
				x: this.obj.p.x,
				y: this.obj.p.y,
				xpx: this.obj.p.x+'px',
				ypx: this.obj.p.y+'px'
			};
		},

		isDownL: function() {
			return this.obj.p.down.l;
		},
		isDown: function() {
			return this.obj.p.isDownL();
		},
		isDownR: function() {
			return this.obj.p.down.r;
		},

		observe: function(s) {
			/*
				event: 'nat_click',
				callback: function() {},
				elements: [el1, el2, el3],
				buttons: ['l','m','r'],
				direct: false                       // If true, events will be created and attached directly to an element instead of document.
			*/
			if (!(s.elements instanceof Array)) s.elements = [s.elements];
			if (s.direct) {
				for (var x=0; x<s.elements.length; x++) {
					for (var y=0; y<this.obj.p.s.events.length; y++) {
						Event.observe(s.elements[x], this.obj.p.s.events[y], this.obj.p.nativeEventFire.bind(this, this.obj.p.s.events[y]));
					}
				}
			}
			var id = 0;
			while (typeof(this.obj.p.events[id]) != 'undefined') id++;
			s.id = id;
			this.obj.p.events.push(s);
			return s;
		},

		unObserve: function(s) {
			for (var key in this.obj.p.events) {
				if (this.obj.p.events[key].id == s.id) this.obj.p.events.splice(key,1);
			}
		},

		// ----------- PRIVATE ---------
		nativeEventFire: function(eventName, e) {                        // Called when a native event gets fired
			var btns = this.obj.p.whichButtons(e);
			var internalEventName = 'nat_'+eventName;
			switch(eventName) {
				case 'mousedown':
					this.obj.p.buttonsUpDown(btns, 'down');
					for (var x=0; x<btns.length; x++) {
						this.obj.p.downPosition[btns[x]] = {
							time: new Date(),
							x: Event.pointerX(e),
							y: Event.pointerY(e)
						};
						this.obj.p.upPosition[btns[x]] = false;
					}
				break;
				case 'mouseup':
					this.obj.p.buttonsUpDown(btns, 'up');
					for (var x=0; x<btns.length; x++) {
						this.obj.p.upPosition[btns[x]] = {
							time: new Date(),
							x: Event.pointerX(e),
							y: Event.pointerY(e)
						};
						if (Math.abs(this.obj.p.downPosition[btns[x]].x - this.obj.p.upPosition[btns[x]].x) < this.obj.p.clickDistance) {
							if (Math.abs(this.obj.p.downPosition[btns[x]].y - this.obj.p.upPosition[btns[x]].y) < this.obj.p.clickDistance) {
								this.obj.p.eventFire('click', btns, e);
							}
						}
					}
				break;
			}
			this.obj.p.x = Event.pointerX(e);
			this.obj.p.y = Event.pointerY(e);
			this.obj.p.executeEvents(internalEventName, btns, e);
		},
		eventFire: function(eventName, btns, e) {                        // Called in order to fire a custom event
			this.obj.p.executeEvents(eventName, btns, e);
		},

		buttonsUpDown: function(buttons, state) {                        // Sets button states to up or down
			for (var x=0; x<buttons.length; x++) this.obj.p.down[buttons[x]] = (state=='down');
		},

		executeEvents: function(eventName, buttons, event) {
			for (var x in this.obj.p.events) {
				if (this.obj.p.events[x].event != eventName) continue;
				var elClicked = Event.element(event);

				// Make sure that this event is only executed if it occurs on the given elements, if any were specified.
				if (this.obj.p.events[x].elements) {
					var noElementMatch = true;
					for (var y=0; y<this.obj.p.events[x].elements.length; y++) {
						if (this.obj.p.events[x].elements[y] == elClicked || DOM.isDescendant(this.obj.p.events[x].elements[y], elClicked)) {
							noElementMatch = false;
						}
					}
					if (noElementMatch) continue;
				}

				// Make sure that the clicked element is not listed among this event's excepted elements
				if (this.obj.p.events[x].except) {
					var noExceptions = true;
					for (var y=0; y<this.obj.p.events[x].except.length; y++) {
						if (this.obj.p.events[x].except[y] == elClicked || DOM.isDescendant(this.obj.p.events[x].except[y], elClicked)) {
							noExceptions = false;
						}
					}
					if (!noExceptions) continue;
				}

				// Make sure that the buttons involved with this event match those given in the event
				// (Only one of the buttons listed in the event declaration needs to be pressed for application.)
				if (this.obj.p.events[x].buttons) {
					var noButtonMatch = true;
					for (var y=0; y<buttons.length; y++) {
						if (this.obj.p.events[x].buttons.indexOf(buttons[y]) != -1) {
							noButtonMatch = false;
							break;
						}
					}
					if (noButtonMatch) continue;
				}

				this.obj.p.events[x].callback(event, elClicked);
			}
		},

		whichButtons: function(e) { // PRIVATE: Returns the buttons involved in this click
			var which = {1:['l'], 2:['m'], 3:['r']};
			var msft = {1:['l'], 2:['r'], 3:['r','l'], 4:['m'], 5:['l','m'], 6:['m','r'], 7:['l','m','r']};
			var dom = {0:['l'], 1:['m'], 2:['r']};

			if (e.which) {
				var btns = which[e.which];
			} else if (e.button) {
				if (document.all) {
					var btns = msft[e.button];
				} else {
					var btns = dom[e.button];
				}
			}
			return btns;
		}
	},

	k: {                                                               // Keyboard
		obj: null,
		s: {
			use: false,
			attachEventsTo: document,
			assumeUpAfter: 100
		},
		keys: {},
		events: [],

		observe: function(callback, keys, upDown) {
			this.events.push({
				keys: keys,
				callback: callback,
				upDown: upDown
			});
		},

		isKeyDown: function(keyCode) {
			return this.keys[keyCode];
		},

		keyDown: function(e) {
			var keyNum = Event.keyCode(e);
			this.k.keys[keyNum] = true;
			this.k.executeEvents(keyNum, 'down');
		},

		keyUp: function(e) {
			var keyNum = Event.keyCode(e);
			this.k.keys[keyNum] = false;
			this.k.executeEvents(keyNum, 'up');
		},

		executeEvents: function(key, upDown) {
			for (var x=0; x<this.events.length; x++) {
				if ((this.events[x].upDown == upDown || this.events[x].upDown == null) && this.events[x].keys.indexOf(key) != -1) this.events[x].callback(upDown);
			}
		}
	}
};
EventSelectors.addLoadEvent(function() {
	HID = new HIDClass({
		p: { use: true },
		k: { use: false }
	});
});