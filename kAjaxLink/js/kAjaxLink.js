var kAjaxLink = Class.create();
kAjaxLink.prototype = {
	initialize: function(s) {
		this.settings = s;
		this.ajax = null;
		this.ajaxUrl = '';
		this.ajaxParams = '';
		this.s = {
			node: null,
			method: 'get',
			c_onComplete: function() {},
			evalResults: false
		};
		for (var key in s) this.s[key] = s[key];
		this.ajaxUrl = this.s.node.getAttribute('href').split('?')[0];
		this.ajaxParams = this.s.node.getAttribute('href').split('?')[1];

		Event.observe(this.s.node, 'click', function(e) {
			Event.stop(e);
			this.ajax = new Ajax.Request(this.ajaxUrl, {
				method: this.s.method,
				parameters: this.ajaxParams,
				onComplete: function(req) {
					if (this.s.evalResults) eval(req.responseText);
					this.s.c_onComplete(req);
				}.bind(this)
			});
		}.bind(this));
	}
};
Behaviour.register({
	'a.kAjaxLink': function(el) {
		new kAjaxLink({node: el});
	}
});
