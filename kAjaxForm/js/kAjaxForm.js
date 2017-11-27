var kAjaxForm = Class.create();
kAjaxForm.prototype = {
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

		Event.observe(this.s.node, 'submit', function(e) {
			Event.stop(e);
			this.ajaxUrl = this.s.node.getAttribute('action');
			this.ajaxParams = Form.serialize(this.s.node);
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