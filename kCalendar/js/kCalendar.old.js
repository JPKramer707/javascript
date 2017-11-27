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
			placeholder:           false,                                  // DOM node to replace with the completed calendar. Leave blank to not insert the calendar automatically.
			weekStarts:            'sun',                                  // Day on which the week shall start
			showOutOfBoundsDates:  true,                                   // Show dates from other months if necessary?
			allowClickOutOfBounds: true,                                   // Allow clicking on "out of bounds" dates?
			allowSelection:        true,                                   // When a date is clicked, should it be highlighted and set as the calendar's new "current date"?
			tweakDOM:              function() {},                          // A callback function which is fed the document fragment object before it is shown. This callback has the opportunity to make changes to the DOM, adding buttons and whatever. It operates directly on the DOM, returning nothing.
			onClickDate:           function() {},                          // Callback: date clicked
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

	create: function() {                                               // Creates the initial DOM build of the calendar
		this.node = document.createElement('div');
		if (this.s.startHidden) Element.hide(this.node);
		if (this.s.placeholder) this.insert(this.s.placeholder);
		this.viewDate(this.viewedDate.date);                             // Appends month-specific nodes to n_table
	},

	viewDate: function(date) {                                         // Changes the calendar's view to a different date
		if (date.format('Y-m') != this.viewedDate.date.format('Y-m') || this.node.innerHTML == '') {
			this.node.innerHTML = this.generateMonth(date);
		}
		this.viewedDate = { date: date.copy() };
		if (this.s.tweakDOM) this.s.tweakDOM(this.node);
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

			var now = new Date();
			this.dates = [];
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
		var table = node.getElementsByTagName('table')[0];
		table.setAttribute('class', this.s.className);
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
				dateData.inBounds = (dateData.date.format('Y-m') == monthYear.format('Y-m'));
				dateData.text = dateData.node.innerHTML;
				dateData.classes = [];
				//dateData.classes.push((dateData.date.format('Y-m-d') == this.selectedDate.date.format('Y-m-d')) ? this.s.classThisDay : ''); // Selected day?
				dateData.classes.push((dateData.inBounds) ? null : this.s.classOutOfBounds);  // In bounds?
				dateData.classes.push((dateData.date.format('Y-m-d') == now.format('Y-m-d')) ? this.s.classToday : null); // Today?
				if (dateData.date.format('Y-m-d') == this.viewedDate.date.format('Y-m-d')) this.viewedDate = dateData;

				// Alter DOM
				dateData.node.setAttribute('class', dateData.classes.join(' '));
				if (!dateData.inBounds && !this.s.showOutOfBoundsDates) dateData.node.innerHTML = '';

				this.dates.push(dateData);                                   // Save data
			}
		}
		Event.observe(table, 'click', this.onClick.bind(this));
	},

	onClick: function(e) {
		var td = Event.findElement(e, 'td');
		if (td) {
			var dateData = this.nodeToData(td);
			if (this.s.allowClickOutOfBounds || dateData.inBounds) {
				if (this.s.onClickDate) this.s.onClickDate({
					obj: this,
					dateData: dateData
				});
				if (this.s.allowSelection) {
					this.selectDate(dateData.date);
				}
			}
		}
	},

	selectDate: function(date) { // Sets the selected date
		if (date.isValid()) {
			if (this.selectedDate) if (this.selectedDate.node) Element.removeClassName(this.selectedDate.node, this.s.classThisDay);
			if (this.selectedWeek) if (this.selectedWeek.node) Element.removeClassName(this.selectedWeek.node, this.s.classThisWeek);
			var data = null;
			if (data = this.dateToData(date)) {
				this.selectedDate = data;
				Element.addClassName(this.selectedDate.node, this.s.classThisDay);
				this.selectedWeek = { node: DOM.getAncestorsByTagName(this.selectedDate.node, 'tr')[0] };
				Element.addClassName(this.selectedWeek.node, this.s.classThisWeek);
			} else {
				// Not found on current calendar
				//this.selectedDate = { date: date };
				//this.viewDate(date);
			}
		} else {
			alert('Invalid date sent to setDate()');
		}
	},

	getDate: function() {
		return this.selectedDate.date;
	},

	dateToData: function(date) {
		// Retrieves the data object for a specific date
		for (var x=0; x<this.dates.length; x++) {
			if (this.dates[x].date.format('Y-m-d') == date.format('Y-m-d')) return this.dates[x];
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