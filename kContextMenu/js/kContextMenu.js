var kContextMenu = Class.create();
kContextMenu.prototype = {
	initialize: function(s) {
		this.settings = s;
		this.node = null;
		this.events = [];
		this.sourceElement = null;
		this.s = {
			elements: null,
			options: {
				/* The name of an option specifies how it will appear in the
				   menu. The value can be one of:
				     Function: A callback function to execute when that item is selected.
				     String: A URL to load when that item is selected.
				*/
				'About kContextMenu': function() {
					alert('By Kramer\nSeptember 5, 2006');
				},
				'div': true,
				'SolutionSet': 'http://www.solutionset.com/',
				'Google': 'http://www.google.com/'
			},
			className: 'kContextMenu'                                      // A class to give to the main container of the menu.
		};
		for (var key in s) {
			this.s[key] = s[key];
		}

		HID.p.observe({
			event: 'nat_contextmenu',
			callback: this.activate.bind(this),
			elements: this.s.elements
		});

		this.node = document.createElement('ul');
		var optCount = 0;
		for (var key in this.s.options) {
			var li = document.createElement('li');
			if (optCount == 0) Element.addClassName(li, 'first');
			if (key == 'div') {
				Element.addClassName(li, 'div');
			} else {
				li.innerHTML = '<p>'+key+'</p>';
				this.events.push(Event.observe(li, 'click', this.selection.bind(this, this.s.options[key])));
			}
			this.node.appendChild(li);

			optCount++;
		}
		//this.events.push(Event.observe(this.node, 'click', function(e) { alert('stopping'); Event.stop(e); }));
		Element.addClassName(this.node, this.s.className);
		Element.hide(this.node);
		this.node = document.getElementsByTagName('body')[0].appendChild(this.node);

		HID.p.observe({
			event: 'click',
			buttons: ['l','m','r'],
			callback: this.deactivate.bind(this),
			elements: document.getElementsByTagName('body')[0]
		});
	},

	selection: function(option, e) {
		Event.stop(e);
		var el = Event.element(e);
		switch(typeof(option)) {
			case 'function':
				option(option, el, e);
			break;
			case 'string':
				window.location.href=option;
			break;
		}
	},

	activate: function(e) {
		Event.stop(e);
		this.node.style.left = HID.p.getPos().xpx;
		this.node.style.top = HID.p.getPos().ypx;
		Element.show(this.node);
	},

	deactivate: function(e) {
		Event.stop(e);
		Element.hide(this.node);
	}
};