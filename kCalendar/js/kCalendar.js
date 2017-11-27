var kCalendar = Class.create();
kCalendar.prototype = {
	/**
	 * @see prototype.js
	 * @see prototype_ss.js
	 * @see Date.js
	 */
	htmlCache: {},                                                     // Global cache of calendar tables, can be used by any instance of kCalendar.
	htmlCacheCount: 0,

	initialize: function(s) {
		this.node = null;                                                // Completed calendar document fragment object
		this.dates = [];                                                 // Registry of dates and their attributes
		this.selectedWeek = null;
		this.selectedDate = {date: null};
		this.viewedDate = {date: null};
		this.s = {
			className:             'kCalendar',                            // Class name to apply to the <table> tag
			classThisDay:          'thisDay',                              // Classname to put on the selected date
			classOutOfBounds:      'outOfBounds',                          // Classname to put on dates in adjacent months
			classThisWeek:         'thisWeek',                             // Classname to put on the <tr> corresponding to the selected date's week
			classToday:            'today',                                // Classname to apply to today's date
			specialDates:          [],                                     // Array of special dates and their significance (holidays, appointments, etc)
			placeholder:           false,                                  // DOM node to replace with the completed calendar. Leave blank to not insert the calendar automatically.
			weekStarts:            'sun',                                  // Day on which the week shall start
			showOutOfBoundsDates:  true,                                   // Show dates from other months if necessary?
			allowClickOutOfBounds: true,                                   // Allow clicking on "out of bounds" dates?
			allowSelection:        true,                                   // When a date is clicked, should it be highlighted and set as the calendar's new "current date"?
			tweakDOM:              function() {},                          // A callback function which is fed the document fragment object before it is shown. This callback has the opportunity to make changes to the DOM, adding buttons and whatever. It operates directly on the DOM, returning nothing.
			onClickDate:           function() {},                          // Callback: date clicked
			onHoverDate:           function() {},                          // Callback: date:mouseover
			tweakSpecialDate:      function() {},                          // Callback which is given dateData about a special date
			startHidden:           false,
			cacheCap:              3,                                      // Number of calendars that can be stored before cache begins to clean up old entires to save RAM (not currently used)
			selectedDate:          false,                                  // The date to set as pre-selected, leave blank for none, must be in JS Date.parse() compatible format otherwise (or a JS date object)
			viewedDate:            new Date()                              // The date to view (really we only use the month portion of this), leave blank for "today", must be in JS Date.parse() compatible format otherwise (or a JS date object)
		};
		for (var key in s) {
			this.s[key] = s[key];
		}
		if (typeof(this.s.selectedDate) == 'string') this.selectedDate.date = new Date(Date.parse(this.s.selectedDate));
		if (typeof(this.s.viewedDate) == 'string') this.viewedDate.date = new Date(Date.parse(this.s.viewedDate));
		if (typeof(this.s.selectedDate) == 'object') this.selectedDate.date = this.s.selectedDate.copy();
		if (typeof(this.s.viewedDate) == 'object') this.viewedDate.date = this.s.viewedDate.copy();
		this.create();
	},

	table: function() {
		return this.node.getElementsByTagName('table')[0];
	},

	create: function() {                                               // Creates the initial DOM build of the calendar
		this.node = document.createElement('div');
		if (this.s.startHidden) Element.hide(this.node);
		if (this.s.placeholder) this.insert(this.s.placeholder);
		this.viewDate(this.viewedDate.date);                             // Appends month-specific nodes to n_table
	},

	viewDate: function(date) {                                         // Changes the calendar's view to a different date
		//alert('Viewing '+date.format('Y-m-d'));
		if (
			(
				date.getYear() != this.viewedDate.date.getYear() ||
				date.getMonth() != this.viewedDate.date.getMonth()
			) || this.node.innerHTML == ''
		) {
			this.node.innerHTML = this.generateMonth(date);
			if (this.s.tweakDOM) this.s.tweakDOM(this.node);
			this.attachEvents(this.node);
		}
		this.viewedDate = { date: date.copy() };
		this.tweakDOM(this.node);
		if (this.selectedDate.date) this.selectDate(this.selectedDate.date);
	},

	generateMonth: function(date) {                                    // innerHTML
		var cacheName = date.format('m-Y');
		var html = '';
		if (typeof(this.htmlCache[cacheName]) != 'undefined') {          // Cached version exists!
			html = this.htmlCache[cacheName].html;
		} else {
			html += '<table>\n';

			var firstDayOfMonth = new Date(Date.parse(date.format('F 1, Y H:i:s')));
			var lastDayOfMonth = new Date(Date.parse(date.format('F t, Y H:i:s')));
			var startDate = firstDayOfMonth.copy();
			var endDate = lastDayOfMonth.copy();

			while (startDate.format('D').toLowerCase() != this.s.weekStarts.toLowerCase()) {
				startDate.setDate(startDate.getDate()-1);
			}
			do {
				endDate.setDate(endDate.getDate()+1);
			} while (endDate.format('D').toLowerCase() != this.s.weekStarts.toLowerCase());
			endDate.setDate(endDate.getDate()-1);                            // Needs to be backed up one
			var monthYearComment = '<!--monthYear='+date.format('F 01, Y')+'-->';

			html += '	<caption>'+date.format('F Y')+monthYearComment+'</caption>\n'+
							'	<thead>\n'+
							'		<tr>\n';

			// First, tap out the day keys
			var currentDate = startDate.copy();
			for (var day=0; day<7; day++) {
				html += '				<th>'+currentDate.format('D').substring(0,1)+'</th>\n';
				currentDate.setDate(currentDate.getDate()+1);
			}
			html += '		</tr>\n'+
							'	</thead>\n'+
							'	<tbody>\n';

			var currentDate = startDate.copy();
			while (currentDate <= endDate) {
				html += '		<tr>\n';
				for (var day=0; day<7; day++) {
					var dateData = {
						date: currentDate.copy(),
						text: currentDate.format('j')
					};

					var dateComment = '<!--date='+dateData.date.format('F j, Y')+'-->';
					html += '			<td>'+dateData.text+dateComment+'</td>\n';

					currentDate.setDate(currentDate.getDate()+1);                // Increment the date
				}
				html += '		</tr>\n';
			}
			html +=	'	</tbody>\n'+
							'</table>\n';

			// Cache management
			this.htmlCacheCount++;
			this.htmlCache[cacheName] = {                                  // Write to cache
				html: html,
				index: this.htmlCacheCount
			};
		}
		return html;
	},

	tweakDOM: function(node) {                                         // Adjusts calendar HTML, which may have come from the cache, to have accurate classnames and events attached to it
		if (typeof(this.s.className) != 'string') {
			for (var x=0; x<this.s.className.length; x++) {
				Element.addClassName(this.node, this.s.className[x]);
			}
		} else {
			Element.addClassName(this.node, this.s.className);
		}
		var tds = node.getElementsByTagName('td');
		this.dates = [];
		var now = new Date();

		var caption = node.getElementsByTagName('caption')[0];
		var monthYear = new Date(Date.parse(DOM.getCommentData('monthYear', caption)));

		for (var x=0; x<tds.length; x++) {
			var dateString = DOM.getCommentData('date', tds[x]);
			if (dateString) {	                                             // It's a day TD
				// Collect data
				var date = new Date(Date.parse(dateString));
				var dateData = {};
				dateData.node = tds[x];
				dateData.date = date.copy();
				//if (dateData.date ==
				dateData.inBounds = (
					dateData.date.getYear() == monthYear.getYear() &&
					dateData.date.getMonth() == monthYear.getMonth()
				);
				dateData.text = dateData.node.innerHTML;
				dateData.classes = [];
				//dateData.classes.push((dateData.date.format('Y-m-d') == this.selectedDate.date.format('Y-m-d')) ? this.s.classThisDay : ''); // Selected day?
				dateData.classes.push((dateData.inBounds) ? null : this.s.classOutOfBounds);  // In bounds?
				dateData.classes.push((
					dateData.date.getYear() == now.getYear() &&
					dateData.date.getMonth() == now.getMonth() &&
					dateData.date.getDate() == now.getDate()
				) ? this.s.classToday : null); // Today?
				if (
					dateData.date.getYear() == this.viewedDate.date.getYear() &&
					dateData.date.getMonth() == this.viewedDate.date.getMonth() &&
					dateData.date.getDate() == this.viewedDate.date.getDate()
				) this.viewedDate = dateData;

				// Alter DOM
				if (!dateData.inBounds && !this.s.showOutOfBoundsDates) {
					dateData.node.innerHTML = '';
				} else {
					// Highlight special dates
					for (var y=0; y<this.s.specialDates.length; y++) {
						if (
							this.s.specialDates[y].date.getYear()  == dateData.date.getYear() &&
							this.s.specialDates[y].date.getMonth() == dateData.date.getMonth() &&
							this.s.specialDates[y].date.getDate()  == dateData.date.getDate()
						) {
							dateData.classes.push('sd_'+this.s.specialDates[y].type);
							this.s.tweakSpecialDate(dateData, this.s.specialDates[y]);
						}
					}
				}
				Element.clearClassNames(dateData.node);
				Element.addClassName(dateData.node, dateData.classes.join(' '));

				this.dates.push(dateData);                                   // Save data
			}
		}
	},

	setSpecialDates: function(list) {
		this.s.specialDates = list;
		this.tweakDOM(this.node);
	},

	/**
	 * Attaches events to the calendar.
	 * @param node the node of the calendar's container
	 */
	attachEvents: function(node) {
		Event.observe(node, 'click', this.onEvent.bind(this, 'click'));
		Event.observe(node, 'mouseover', this.onEvent.bind(this, 'mouseover'));
	},

	onEvent: function(eventType, e) {
		// Find the affected date TD
		var td = Event.findElement(e, 'td');
		var dateData = this.nodeToData(td);
		var date = dateData.date;
		if (typeof(date) == 'undefined') {                               // Not a date TD
		} else if (date.isValid()) {                                     // Valid date
			if (eventType == 'click') this.clickDate(dateData.date);
			if (eventType == 'mouseover') this.s.onHoverDate({
				dateData: dateData,
				e: e,
				td: td
			});
		} else {
			// Invalid date
		}
	},

	clickDate: function(date) {                                        // Simulates a user's clicking on a date
		var dateData = this.dateToData(date);
		if (!dateData) {                                                 // date is just a plain date object, not a dateData object
			this.viewDate(date);                                           // Switch this calendar to a view of that date in it's month's context
			var dateData = this.dateToData(date);                          // Try grabbing dateData object by the date supplied
			if (!dateData) {                                               // If it didn't work, then abort.
				alert('Could not resolve date in clickDate()');
				return false;
			}
		}
		if (this.s.allowClickOutOfBounds || dateData.inBounds) {         // If user is allowed to click here
			if (this.s.onClickDate) this.s.onClickDate({                   // Process callback if any
				obj: this,
				dateData: dateData
			});
			if (this.s.allowSelection) this.selectDate(date);              // Select the clicked date if permitted
		}
	},

	selectDate: function(date) {                                       // Sets the selected date
		if (this.selectedDate) if (this.selectedDate.node) Element.removeClassName(this.selectedDate.node, this.s.classThisDay);
		if (this.selectedWeek) if (this.selectedWeek.node) Element.removeClassName(this.selectedWeek.node, this.s.classThisWeek);
		if (date == null) {                                              // Unselect date
			this.selectedDate.date = null;
		} else {
			if (date.isValid()) {
				var data = null;
				if (data = this.dateToData(date)) {
					this.selectedDate = data;
					Element.addClassName(this.selectedDate.node, this.s.classThisDay);
					this.selectedWeek = { node: DOM.getAncestorsByTagName(this.selectedDate.node, 'tr')[0] };
					Element.addClassName(this.selectedWeek.node, this.s.classThisWeek);
				} else {
					// Not found on current calendar
					this.selectedDate = { date: date };
					//this.viewDate(date);
				}
			} else {
				alert('Invalid date sent to setDate()');
			}
		}
	},

	getDate: function() {
		return this.selectedDate.date;
	},

	dateToData: function(date) {
		// Retrieves the data object for a specific date
		for (var x=0; x<this.dates.length; x++) {
			if (this.dates[x].date.getYear() != date.getYear()) continue;
			if (this.dates[x].date.getMonth() != date.getMonth()) continue;
			if (this.dates[x].date.getDate() != date.getDate()) continue;
			return this.dates[x];
		}
		return false;
	},

	nodeToData: function(tdnode) {
		// Retrieves the data object for a specific date
		for (var x=0; x<this.dates.length; x++) {
			if (this.dates[x].node == tdnode) return this.dates[x];
		}
		return false;
	},

	showDate: function(date) {
	},

	insert: function(replaceWhat) {
		DOM.replace(replaceWhat, this.node);
	},

	getHTML: function() {
		return this.html;
	}
};

var Debug = Class.create();
Debug.prototype = {
	initialize: function() {
		this.clear();
	},

	clear: function() {
		this.hits = [];
	},

	checkpoint: function(name) {
		this.hits.push({
			date: new Date(),
			name: name
		});
	},

	report: function() {
		var count = {};
		var txt = '';
		for (var x=0; x<this.hits.length-1; x++) {
			var diff = this.hits[x+1].date.getTime() - this.hits[x].date.getTime();
			if (diff > 0) txt += this.hits[x].name+' TO '+this.hits[x+1].name+' = '+diff+'\n';
		}
		//for (var x=0; x<this.hits.length; x++) {
		//	txt += this.hits[x].name+' TO...\n';
		//	for (var y=0; y<this.hits.length; y++) {
		//		var diff = this.hits[y].date.getTime() - this.hits[x].date.getTime();
		//		if (diff > 0) txt += ':::::'+this.hits[y].name+' = '+diff+' ms\n';
		//	}
		//}
		if (txt.length > 0) alert(txt);
	}
};
var D = new Debug();