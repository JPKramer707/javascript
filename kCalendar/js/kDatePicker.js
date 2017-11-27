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
		this.d_lastClick = new Date();
		this.d_lastBlur = null;
		this.s = {
			format: 'm-d-Y',
			n_formField: null,
			showMonthNav: true,
			showTodayButton: true,
			className: ['kCalendar','kDatePicker'],                        // Class name to apply to the calendar element
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
		Event.observe(this.s.n_formField, 'blur', this.blur.bind(this));

		this.calendar.node.style.position = 'absolute';
	},

	parseTextValue: function() {
		// Tries to parse the form field's value and set it as the calendar's selected
		// date.
		var newDate = new Date(Date.parse(this.s.n_formField.value));
		if (newDate.isValid()) {
			this.calendar.selectDate(newDate);
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
				this.calendar.selectDate(newDate);
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
				this.calendar.clickDate(new Date());
			}.bind(this));
		}
	},

	changeMonth: function(relativeSkip) {
		this.calClick();
		var nextMonth = this.calendar.viewedDate.date.copy();
		var date = nextMonth.getDate();
		nextMonth.setDate(1);
		nextMonth.setMonth(nextMonth.getMonth()+relativeSkip);
		nextMonth.setDate(Math.min(date, nextMonth.format('t')));
		this.calendar.viewDate(nextMonth);
	},

	calClick: function() {                                             // Calendar was clicked
		this.d_lastClick = new Date();
		this.log(' LC: '+this.d_lastClick.getTime().toString().substr(7));
		this.s.n_formField.focus();
	},

	blur: function() {
		this.d_lastBlur = new Date();
		if (this.t_blurHide != null) {
			this.log('Timeout cleared');
			clearTimeout(this.t_blurHide);
			this.t_blurHide = null;
		}
		this.log('BL: '+this.d_lastBlur.getTime().toString().substr(7));
		var variance = 200;
		if (this.d_lastBlur.getTime()-variance > this.d_lastClick.getTime()) {
			this.log('Timeout set');
			this.t_blurHide = setTimeout(function(variance) {
				this.log('Timeout executed');
				this.log(' Blur caught '+(this.d_lastClick.getTime()-this.d_lastBlur.getTime())+'ms after click');
				if (this.d_lastBlur.getTime()-variance > this.d_lastClick.getTime()) {
					this.log('Hiding');
					this.hide();
				}
				this.t_blurHide = null;
			}.bind(this, variance), 500);
		}
	},

	log: function(text) {
		//document.getElementsBySelector('body .log')[0].innerHTML += text+'<br />\n';
	},

	open: function() {
		// Reposition the calendar in case the input field has moved
		var fieldPos = Position.cumulativeOffset(this.s.n_formField);
		this.calendar.node.style.left = fieldPos[0]+'px';
		this.calendar.node.style.top = (fieldPos[1] + Element.getHeight(this.s.n_formField))+'px';

		Element.show(this.calendar.node);
	},

	hide: function() {
		Element.hide(this.calendar.node);
	},

	onClickDate: function(data) {
		this.updateField(data);
		this.hide();
		this.calendar.viewDate(data.dateData.date);
	},

	updateField: function(data) {
		this.s.n_formField.value = data.dateData.date.format(this.s.format);
	}
};
Behaviour.register({
	'input.date': function(el) {
		new kDatePicker({
			n_formField: el,
			format: 'm/d/Y'
		});
	}
});