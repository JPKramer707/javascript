var kCalSet = Class.create();
kCalSet.prototype = {
	initialize: function(s) {
		this.settings = s;
		this.viewedDate = null;
		this.selectedDate = null;
		this.calendars = [];
		this.s = {
			container: null,
			btnPrev: null,
			btnNext: null,
			calendars: [],
			onClickDate: function() {},
			onHoverDate: function() {},
			specialDates: [],
			tweakSpecialDate: function() {},
			date: new Date()
		};
		for (var key in s) {
			this.s[key] = s[key];
		}
		this.viewedDate = this.s.date.copy();
		this.selectedDate = this.s.date.copy();

		Event.observe(this.s.btnPrev, 'click', this.previous.bind(this));
		Event.observe(this.s.btnNext, 'click', this.next.bind(this));

		for (var x=0; x<this.s.calendars.length; x++) {
			this.calendars.push(new kCalendar({
				placeholder: this.s.calendars[x],
				onClickDate: this.onClickDate.bind(this),
				onHoverDate: this.s.onHoverDate,
				specialDates: this.s.specialDates,
				tweakSpecialDate: this.s.tweakSpecialDate,
				showOutOfBoundsDates: false,
				allowClickOutOfBounds: false
			}));
		}
		this.refresh();
	},

	setSpecialDates: function(list) {
		this.s.specialDates = list;
		for (var x=0; x<this.calendars.length; x++) {
			this.calendars[x].setSpecialDates(list);
		}
	},

	onClickDate: function(datePackage) {
		this.selectedDate = datePackage.dateData.date.copy();
		this.viewedDate = datePackage.dateData.date.copy();
		this.refresh();
		this.s.onClickDate(datePackage);
	},

	previous: function() {
		this.viewedDate.setMonth(this.viewedDate.getMonth()-1);
		this.refresh();
	},

	next: function() {
		this.viewedDate.setMonth(this.viewedDate.getMonth()+1);
		this.refresh();
	},

	refresh: function() {
		var thisDate = this.viewedDate.copy();
		thisDate.setDate(1);
		var calendarCount = this.calendars.length;
		var rollBack = parseInt(calendarCount/2);
		thisDate.setMonth(thisDate.getMonth()-rollBack);
		for (var x=0; x<this.calendars.length; x++) {
			if (
				this.viewedDate.getMonth() == thisDate.getMonth() &&
				this.viewedDate.getYear() == thisDate.getYear()
			) {
				this.calendars[x].selectedDate.date = this.selectedDate.copy();// Contains the selected date
			} else {
				this.calendars[x].selectedDate.date = null;                  // Unselect all dates within
				this.calendars[x].selectedDate.date = this.selectedDate.copy();// Contains the selected date
			}
			this.calendars[x].viewDate(thisDate);
			thisDate.setMonth(thisDate.getMonth()+1); // Increment month
		}
	}
};
