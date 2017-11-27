var kToolTip = Class.create();
kToolTip.prototype = {
	initialize: function(s) {
		this.settings = s;
		this.tooltips = [];
		this.s = {
			delayBeforeOpen: 500,
			delayBeforeClose: 0,
			className: 'tooltip'
		};
	},

	create: function(data) {
		// data.el
		// data.content
		var tt = {
			el: data.el,
			tipEl: null,
			content: data.content,
			state: 'closed',
			timer: null
		};

		tt.tipEl = document.createElement('div');
		Element.hide(tt.tipEl);
		Element.addClassName(tt.tipEl, this.s.className);
		tt.tipEl.style.position = 'absolute';
		tt.tipEl.innerHTML = tt.content;
		document.getElementsByTagName('body')[0].appendChild(tt.tipEl);

		Event.observe(data.el, 'mouseover', function(tt, e) {
			if (tt.state == 'closed') { // Start opening
				tt.state = 'opening';
				tt.timer = setTimeout(function(tt, e) {
					tt.state = 'open';
					tt.timer = null;
					tt.tipEl.style.left = (HID.p.getPos().x+1)+'px';
					tt.tipEl.style.top = HID.p.getPos().ypx;
					Element.show(tt.tipEl);
				}.bind(this, tt, e), this.s.delayBeforeOpen);
			} else if (tt.state = 'closing') { // Re-open
				clearTimeout(tt.timer);
				tt.timer = null;
				tt.state = 'open';
			}
		}.bind(this, tt));

		Event.observe(data.el, 'mouseout', function(tt, e) {
			if (tt.state == 'open') {
				tt.state = 'closing';
				tt.timer = setTimeout(function(tt, e) {
					tt.state = 'closed';
					tt.timer = null;
					Element.hide(tt.tipEl);
				}.bind(this, tt, e), this.s.delayBeforeClose);
			} else if (tt.state == 'opening') {
				clearTimeout(tt.timer);
				tt.timer = null;
				tt.state = 'closed';
			}
		}.bind(this, tt));

		this.tooltips.push(tt);
	}
}
ToolTip = new kToolTip();