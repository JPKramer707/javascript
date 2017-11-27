var HIDClass = Class.create();
HIDClass.prototype = {
	/**
	 * Human Interface Device
	 **/
	initialize: function(s) {
		this.settings = s;
		this.body = document.getElementsByTagName('body')[0];
		this.s = {
			pointer: false,
			keyboard: false
		};
		for (var key in s) this.s[key] = s[key];

		if (this.s.pointer) Event.observe(this.body, 'mousemove', this.p.updatePos.bind(this));
	},

	p: {                                                               // Pointer
		x: false,
		y: false,

		getPos: function() {                                             // gets current pixel position
			return {
				x: this.x,
				y: this.y,
				xpx: this.x+'px',
				ypx: this.y+'px'
			};
		},

		updatePos: function(e) {                                         // PRIVATE: updates cursor position
			this.p.x = Event.pointerX(e);
			this.p.y = Event.pointerY(e);
		}
	},

	k: {                                                               // Keyboard
	}
};
Behaviour.addLoadEvent(function() {
	HID = new HIDClass({pointer: true});
});