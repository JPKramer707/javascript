var kButton = Class.create();
kButton.prototype = {
	initialize: function(s) {
		this.events = [];
		this.state = 'up';
		this.s = {
			element: null,                                                 // Element acting as the button
			toggle: false,                                                 // Should the button stick up/down or act momentarily
			initialState: 'up',                                            // State the button is in at instantiation
			urlDown: false,                                                // Image URL to use for a down state
			urlUp: false,                                                  // Image URL to use for an up state
			appendixDown: '_down',
			appendixUp: '',
			c_onClick: function() {},
			c_onToggleDown: function() {},
			c_onToggleUp: function() {}
		};
		for (var key in s) this.s[key] = s[key];
		this.state = this.s.initialState;

		// Autodetect the up or down URL, if not provided in settings.
		if (this.s.initialState == 'up' && !this.s.urlUp) this.s.urlUp = this.s.element.src;
		if (this.s.initialState == 'down' && !this.s.urlUp) this.s.urlDown = this.s.element.src;
		if (!this.s.urlUp) this.s.urlUp = filenameAppend(this.s.element.src, this.s.appendixUp);
		if (!this.s.urlDown) this.s.urlDown = filenameAppend(this.s.element.src, this.s.appendixDown);

		// Attach events
		this.events.push(Event.observe(this.s.element, 'click', this.onClick.bind(this)));
		this.events.push(Event.observe(this.s.element, 'mousedown', this.onMouseDown.bind(this)));
		this.events.push(Event.observe(this.s.element, 'mouseup', this.onMouseUp.bind(this)));
	},

	onClick: function(e) {
		this.s.c_onClick();
	},

	onMouseDown: function(e) {
		this.s.element.src = this.s.urlDown;
	},

	onMouseUp: function(e) {
		if (this.s.toggle) {
			switch(this.state) {
				case 'up':
					this.forceDown();
				break;
				case 'down':
					this.forceUp();
				break;
			}
		} else {
			this.s.element.src = this.s.urlUp;
		}
	},

	forceUp: function() {
		this.state = 'up';
		this.s.element.src = this.s.urlUp;
		this.s.c_onToggleUp();
	},
	forceDown: function() {
		this.state = 'down';
		this.s.c_onToggleDown();
	}
};

function filenameAppend(originalName,appendix) {
	var part2 = originalName.substring(-4);
	var part1 = originalName.substring(0,-4);
	return part1+appendix+part2;
}
