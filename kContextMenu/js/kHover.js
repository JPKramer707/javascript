/**
 * kHover
 *
 * @see document.getElementsBySelector.js
 */
kHover = Class.create();
kHover.prototype = {
	initialize: function(s) {
		this.settings = s;
		this.events = [];
		this.s = {
			applyTo: ['*'],                                                // Selectors to pay attention to, everything else is ignored.
			hoverClass: 'hover'                                            // The class to attach to an element during the time it is being mouseovered
		}
		for (var key in s) this.s[key] = s[key];

		if (!document.all) return false;                                 // Not needed outside of MSIE

		if (!(this.s.applyTo instanceof Array)) this.s.applyTo = [this.s.applyTo];
		for (var x=0; x<this.s.applyTo.length; x++) {
			var elements = document.getElementsBySelector(this.s.applyTo[x]);
			for (var y=0; y<elements.length; y++) {
				this.events.push(Event.observe(elements[y], 'mouseover', this.hover.bind(this, elements[y], 'add')));
				this.events.push(Event.observe(elements[y], 'mouseout',  this.hover.bind(this, elements[y], 'remove')));
			}
		}
	},

	hover: function(el, addRemove) {
		Element[addRemove+'ClassName'](el, this.s.hoverClass);
	}
}