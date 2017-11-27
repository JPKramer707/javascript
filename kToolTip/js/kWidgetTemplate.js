var kWidgetTemplate = Class.create();
kWidgetTemplate.prototype = {
	initialize: function(s) {
		this.settings = s;
		this.s = {
		};
		for (var key in s) {
			this.s[key] = s[key];
		}
	}
};