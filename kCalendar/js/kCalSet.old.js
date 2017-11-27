var kCalSet = Class.create();
kCalSet.prototype = {
	initialize: function(s) {
		this.settings = s;
		this.currentDate = null;
		this.calendars = [];
		this.s = {
			container: null,
			btnPrev: null,
			btnNext: null,
			calendars: [],
			onClickDate: function() {},
			date: new Date()
		};
		for (var key in s) {
			this.s[key] = s[key];
		}
		this.currentDate = this.s.date.copy();

		Event.observe(this.s.btnPrev, 'click', this.previous.bind(this));
		Event.observe(this.s.btnNext, 'click', this.next.bind(this));

		for (var x=0; x<this.s.calendars.length; x++) {
			this.calendars.push(new kCalendar({
				placeholder: this.s.calendars[x],
				onClickDate: this.s.onClickDate,
				showOutOfBoundsDates: false,
				allowClickOutOfBounds: false
			}));
		}
		this.refresh();
	},

	previous: function() {
		this.currentDate.setMonth(this.currentDate.getMonth()-1);
		this.refresh();
	},

	next: function() {
		this.currentDate.setMonth(this.currentDate.getMonth()+1);
		this.refresh();
	},

	refresh: function() {
		var thisDate = this.currentDate.copy();
		thisDate.setDate(1);
		var calendarCount = this.calendars.length;
		var rollBack = parseInt(calendarCount/2);
		thisDate.setMonth(thisDate.getMonth()-rollBack);
		for (var x=0; x<this.calendars.length; x++) {
			if (this.currentDate.getMonth() == thisDate.getMonth()) {
				// Highlighted month
				this.calendars[x].selectDate(this.currentDate);
			}
			this.calendars[x].viewDate(thisDate);
			thisDate.setMonth(thisDate.getMonth()+1); // Increment month
		}
	}
};
