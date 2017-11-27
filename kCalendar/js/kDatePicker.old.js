var kDatePicker = Class.create();
kDatePicker.prototype = {
	/**
	 * @see kCalendar.js
	 * @see behaviour.js
	 */
	initialize: function(s) {
		this.settings = s;
		this.calendar = null;
		this.t_blurHide = null;
		this.d_lastClick = null;
		this.s = {
			format: 'm-d-Y',
			n_formField: null,
			showMonthNav: true,
			showTodayButton: true,
			className: 'kCalendar kDatePicker',                            // Class name to apply to the calendar element
			blurAfterClickWait: 400
		};
		for (var key in s) {
			this.s[key] = s[key];
		}

		var placeHolder = document.createComment('insertHere');
		document.getElementsByTagName('body')[0].appendChild(placeHolder);
		this.calendar = new kCalendar({
			placeholder: placeHolder,
			className: this.s.className,
			startHidden: true,
			tweakDOM: this.insertButtons.bind(this),
			onClickDate: this.onClickDate.bind(this)
		});
		this.parseTextValue();

		Event.observe(this.s.n_formField, 'click', this.open.bind(this));
		Event.observe(this.s.n_formField, 'change', this.parseTextValue.bind(this));
		Event.observe(this.calendar.node, 'click', this.calClick.bind(this), true);
		Event.observe(this.s.n_formField, 'blur', function() {
			setTimeout(this.blur.bind(this), 50);
		}.bind(this));

		var fieldPos = Position.cumulativeOffset(this.s.n_formField);
		this.calendar.node.style.position = 'absolute';
		this.calendar.node.style.left = fieldPos[0]+'px';
		this.calendar.node.style.top = (fieldPos[1] + Element.getHeight(this.s.n_formField))+'px';
	},

	parseTextValue: function() {
		// Tries to parse the form field's value and set it as the calendar's selected
		// date.
		var newDate = new Date(Date.parse(this.s.n_formField.value));
		if (newDate.isValid()) {
			this.calendar.setDate(newDate);
		} else {			                                                   // Try some more radical stuff before giving up
			var text = this.s.n_formField.value;
			text = text.replace(/\//, '-');
			var bits = text.split('-');
			var newDate = new Date();
			if (bits[2] < 100) bits[2] = parseInt(bits[2]) + 2000; // Lame Y2k fix
			newDate.setYear(bits[2]);
			newDate.setMonth(bits[0]-1);
			newDate.setDate(bits[1]);
			if (newDate.isValid()) {
				this.calendar.setDate(newDate);
			}
		}
		this.s.n_formField.value = this.calendar.getDate().format(this.s.format);
	},

	insertButtons: function(dom) {
		// This function makes patches to the DOM document fragment object created
		// by kCalendar, adding in functionality needed for a date picker. If you
		// want to make changes to the HTML of the calendar, this is the place to
		// do it.
		if (this.s.showMonthNav) {
			var cap = dom.getElementsByTagName('caption')[0];
			var prevMonth = document.createElement('div');
			prevMonth.appendChild(document.createTextNode('<'));
			Element.addClassName(prevMonth, 'prev');
			var nextMonth = document.createElement('div');
			nextMonth.appendChild(document.createTextNode('>'));
			Element.addClassName(nextMonth, 'next');
			prevMonth = DOM.insertChild(prevMonth, cap);
			DOM.insertChild(nextMonth, cap);

			Event.observe(prevMonth, 'click', this.changeMonth.bind(this, -1));
			Event.observe(nextMonth, 'click', this.changeMonth.bind(this, 1));
		}
		if (this.s.showTodayButton) {
			var tbody = dom.getElementsByTagName('tbody')[0];
			var tfoot = document.createElement('tfoot');
			var today = document.createElement('div');
			var tr = document.createElement('tr');
			var td = document.createElement('td');
			td.setAttribute('colSpan', 7);
			today.appendChild(document.createTextNode('Today'));
			tfoot.appendChild(tr);
			tr.appendChild(td);
			td.appendChild(today);
			DOM.insertAfter(tfoot, tbody);

			Event.observe(today, 'click', function() {
				this.calendar.viewDate(new Date());
			}.bind(this));
		}
	},

	changeMonth: function(relativeSkip) {
		var nextMonth = this.calendar.viewedDate.date.copy();
		var date = nextMonth.getDate();
		nextMonth.setDate(1);
		nextMonth.setMonth(nextMonth.getMonth()+relativeSkip);
		nextMonth.setDate(Math.min(date, nextMonth.format('t')));
		this.calendar.viewDate(nextMonth);
	},

	calClick: function() {                                             // Calendar was clicked
		this.d_lastClick = new Date();
		this.s.n_formField.focus();
		if (this.t_blurHide != null) {
			clearTimeout(this.t_blurHide);
			this.t_blurHide = null;
		}
	},

	blur: function() {
		var now = new Date();
		var timeOk = null;
		if (this.d_lastClick != null) timeOk = ((now.getTime() - this.d_lastClick.getTime()) > this.s.blurAfterClickWait);
		if (this.d_lastClick == null || timeOk) {
			this.t_blurHide = setTimeout(this.hide.bind(this), 100);
		}
	},

	open: function() {
		Element.show(this.calendar.node);
	},

	onClickDate: function(data) {
		this.updateField(data);
		this.hide();
		this.calendar.viewDate(data.dateData.date);
	},

	hide: function() {
		Element.hide(this.calendar.node);
	},

	updateField: function(data) {
		this.s.n_formField.value = data.dateData.date.format(this.s.format);
	}
};
Behaviour.register({
	'input.date': function(el) {
		new kDatePicker({
			n_formField: el
		});
	}
});