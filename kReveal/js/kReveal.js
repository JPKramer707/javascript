var kReveal = Class.create();
kReveal.prototype = {
	initialize: function(s) {
		this.settings = s;
		this.revealers = [];
		this.s = {
			className:     'kReveal',
			event:         'click',
			beforeReveal:  function() {},
			afterReveal:   function() {},
			revealMethod:  function(el) {
				el.style.display = 'block';
			}
		};
		for (var key in s) this.s[key] = s[key];

		this.revealers = document.getElementsByClassName(this.s.className);
		for (var x=0; x<this.revealers.length; x++) {
			Event.observe(this.revealers[x], this.s.event, function(el) {
				this.s.beforeReveal(el);
				var classes = el.className.split(' ');
				for (var x=0; x<classes.length; x++) {
					if (classes[x].substr(0, 5) == 'show_') var targetClass = classes[x].substr(5);
				}
				var revealees = document.getElementsByClassName(targetClass);
				for (var x=0; x<revealees.length; x++) {
					this.s.revealMethod(revealees[x]);
				}
				this.s.afterReveal(el);
			}.bind(this, this.revealers[x]));
		}
	}
};
EventSelectors.onDOMLoad(function() {
	new kReveal();
});