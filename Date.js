/**
 * Date object extentions
 * By Kramer, 060517
 */

/**
 * Clips unnecessary precision from a date - can take
 * you to the start or end of a hour, day, month, year, etc
 *
 * @param precision STRING Where to stop clipping the date, corresponding
 *                         to a "precName" listed in the array below.
 * @param startEnd  STRING "start" or "end" depending on if you want the
 *                         date clip to correspond to the start or end of
 *                         the date unit you selected in the "precision" arg.
 **/
Date.prototype.clip = function(precision, startEnd) {
	var newDate = this.copy();
	// Range: Min and max values, corresponding to the "start" and "end."
	// precName: A human-friendly "precision name" showing what value to clip to.
	// method: The Date object method to use in clipping up to this precision.
	var setters = [
		{range: [0,999],  precName: 'sec',   method: 'setMilliseconds'},
		{range: [0,59],   precName: 'min',   method: 'setSeconds'},
		{range: [0,59],   precName: 'hour',  method: 'setMinutes'},
		{range: [0,23],   precName: 'day',   method: 'setHours'},
		{range: [0,null], precName: 'month', method: 'setDay'},
		{range: [0,11],   precName: 'year',  method: 'setMonth'}
	];
	for (var x=0; x<setters.length; x++) {
		newDate[setters[x].method](setters[x].range[(startEnd == 'start') ? 0 : 1]);
		if (setters[x].precName == precision) break;
	}
	return newDate;
}

Date.prototype.copy = function(logOn) {
	// Returns a COPY of the given date object
	newDate = new Date(this);
	return newDate;
}

Date.prototype.compareTo = function(date) {
	// This seems unecessary, since dates are directly comparable, apparently.
	// Compares this date to another date
	// Returns:
	//   -1 if this < date
	//    0 if this == date
	//    1 if this > date
	var compare = ['getYear', 'getMonth', 'getDay', 'getHours', 'getMinutes', 'getSeconds', 'getMilliseconds'];
	for (var x=0; x<compare.length; x++) {
		if (this[compare[x]]() > date[compare[x]]()) return 1
		if (this[compare[x]]() == date[compare[x]]()) return 0
		if (this[compare[x]]() < date[compare[x]]()) return -1
	}
}

Date.prototype.isValid = function() {
	// Returns true if the date object is valid
	return (this.toString() != 'Invalid Date' && this.toString() != 'NaN');
}

Date.prototype.format = function(format) {
	// Formats a date in any desired format.
	// Duplicates the functionality of PHP's date() function.
	// http://us3.php.net/date
	var output = '';

	// Y2K-proofing
	var year = this.getYear();
	if (year < 1000) year += 1900;

	var monthNames = [
		{short: 'Jan', long: 'January'},
		{short: 'Feb', long: 'February'},
		{short: 'Mar', long: 'March'},
		{short: 'Apr', long: 'April'},
		{short: 'May', long: 'May'},
		{short: 'Jun', long: 'June'},
		{short: 'Jul', long: 'July'},
		{short: 'Aug', long: 'August'},
		{short: 'Sep', long: 'September'},
		{short: 'Oct', long: 'October'},
		{short: 'Nov', long: 'November'},
		{short: 'Dec', long: 'December'}
	];
	var dayNames = [
		{initial: 'S', short: 'Sun', long: 'Sunday'},
		{initial: 'M', short: 'Mon', long: 'Monday'},
		{initial: 'T', short: 'Tue', long: 'Tuesday'},
		{initial: 'W', short: 'Wed', long: 'Wednesday'},
		{initial: 'T', short: 'Thu', long: 'Thursday'},
		{initial: 'F', short: 'Fri', long: 'Friday'},
		{initial: 'S', short: 'Sat', long: 'Saturday'}
	];
	var daysInMonth = [31, ((year % 4 == 0 && year % 100 != 0) || year % 400 == 0 ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
	if (this.getHours() > 12) {
		var hours12 = (this.getHours() - 12);
		var ampm = 'pm';
	} else if (this.getHours() == 0) {
		var hours12 = 12;
		var ampm = 'am';
	} else {
		var hours12 = this.getHours();
		var ampm = 'am';
	}

	for (var x=0; x<format.length; x++) {
		var character = format.substr(x,1);
		var result = '';

		switch(character) {
			case '\\':                                                     // Escape Code
				x++;                                                         // Skip to the next character
				result = format.substr(x,1);                                 // Take that next character as the current one
			break;

			// Day
			case 'd':                                                      // Day of the month, 2 digits with leading zeros 01 to 31
				result = this.getDate().zeroPad(2);
			break;
			case 'D':                                                      // A textual representation of a day, three letters Mon through Sun
				result = dayNames[this.getDay()].short;
			break;
			case 'j':                                                      // Day of the month without leading zeros 1 to 31
				result = this.getDate();
			break;
			case 'l':                                                      // (lowercase 'L') A full textual representation of the day of the week Sunday through Saturday
				result = dayNames[this.getDay()].long;
			break;
			case 'N':                                                      // ISO-8601 numeric representation of the day of the week (added in PHP 5.1.0) 1 (for Monday) through 7 (for Sunday)
			break;
			case 'S':                                                      // English ordinal suffix for the day of the month, 2 characters st, nd, rd or th. Works well with j
			break;
			case 'w':                                                      // Numeric representation of the day of the week 0 (for Sunday) through 6 (for Saturday)
			break;
			case 'z':                                                      // The day of the year (starting from 0) 0 through 365
			break;

			// Week
			case 'W':                                                      // ISO-8601 week number of year, weeks starting on Monday (added in PHP 4.1.0) Example: 42 (the 42nd week in the year)
			/*
				// Borrowed from Svend Tofte <www.svendtofte.com> (http://www.svendtofte.com/code/date_format/)

				// Weeknumber, as per ISO specification:
				// http://www.cl.cam.ac.uk/~mgk25/iso-time.html

				// if the day is three days before newyears eve,
				// there's a chance it's "week 1" of next year.
				// here we check for that.
				var beforeNY = 364+this.format('L') - this.format('z');
				var afterNY  = this.format('z');
				var weekday = this.format('w')!=0?this.format('w')-1:6; // makes sunday (0), into 6.
				if (beforeNY <= 2 && weekday <= 2-beforeNY) {
						result = 1;
				}
				// similarly, if the day is within threedays of newyears
				// there's a chance it belongs in the old year.
				var ny = new Date("January 1 " + this.format('Y') + " 00:00:00");
				var nyDay = ny.getDay()!=0?ny.getDay()-1:6;
				if (
						(afterNY <= 2) &&
						(nyDay >=4)  &&
						(afterNY >= (6-nyDay))
						) {
						// Since I'm not sure we can just always return 53,
						// i call the function here again, using the last day
						// of the previous year, as the date, and then just
						// return that week.
						var prevNY = new Date("December 31 " +
																		(this.format('Y')-1) + " 00:00:00");
						result = prevNY.formatDate("W");
				}

				// week 1, is the week that has the first thursday in it.
				// note that this value is not zero index.
				if (nyDay <= 3) {
						// first day of the year fell on a thursday, or earlier.
						result = 1 + Math.floor( ( this.format('z') + nyDay ) / 7 );
				} else {
						// first day of the year fell on a friday, or later.
						result = 1 + Math.floor( ( this.format('z') - ( 7 - nyDay ) ) / 7 );
				}
				*/
			break;
			// Month
			case 'F':                                                      // A full textual representation of a month, such as January or March January through December
				result = monthNames[this.getMonth()].long;
			break;
			case 'm':                                                      // Numeric representation of a month, with leading zeros 01 through 12
				result = (this.getMonth()+1).zeroPad(2);
			break;
			case 'M':                                                      // A short textual representation of a month, three letters Jan through Dec
				result = monthNames[this.getMonth()].short;
			break;
			case 'n':                                                      // Numeric representation of a month, without leading zeros 1 through 12
				result = (this.getMonth()+1);
			break;
			case 't':                                                      // Number of days in the given month 28 through 31 (sensitive to given year, accounts for leap year)
				result = daysInMonth[this.getMonth()];
			break;

			// Year
			case 'L':                                                      // Whether it's a leap year 1 if it is a leap year, 0 otherwise.
				result = ((year % 4 == 0 && year % 100 != 0) || year % 400 == 0 ? 1 : 0);
			break;
			case 'o':                                                      // ISO-8601 year number. This has the same value as Y, except that if the ISO week number (W) belongs to the previous or next year, that year is used instead. (added in PHP 5.1.0) Examples: 1999 or 2003
			break;
			case 'Y':                                                      // A full numeric representation of a year, 4 digits Examples: 1999 or 2003
				result = year;
			break;
			case 'y':                                                      // A two digit representation of a year Examples: 99 or 03
				result = year.toString().substr(2);
			break;

			// Time
			break;
			case 'a':                                                      // Lowercase Ante meridiem and Post meridiem am or pm
				result = ampm;
			break;
			case 'A':                                                      // Uppercase Ante meridiem and Post meridiem AM or PM
				result = ampm.toUpperCase();
			break;
			case 'B':                                                      // Swatch Internet time 000 through 999
			break;
			case 'g':                                                      // 12-hour format of an hour without leading zeros 1 through 12
				result = hours12;
			break;
			case 'G':                                                      // 24-hour format of an hour without leading zeros 0 through 23
				result = this.getHours();
			break;
			case 'h':                                                      // 12-hour format of an hour with leading zeros 01 through 12
				result = hours12.zeroPad(2);
			break;
			case 'H':                                                      // 24-hour format of an hour with leading zeros 00 through 23
				result = this.getHours().zeroPad(2);
			break;
			case 'i':                                                      // Minutes with leading zeros 00 to 59
				result = this.getMinutes().zeroPad(2);
			break;
			case 's':                                                      // Seconds, with leading zeros 00 through 59
				result = this.getSeconds().zeroPad(2);
			break;

			// Timezone
			case 'e':                                                      // Timezone identifier (added in PHP 5.1.0) Examples: UTC, GMT, Atlantic/Azores
			break;
			case 'I':                                                      // (capital i) Whether or not the date is in daylights savings time 1 if Daylight Savings Time, 0 otherwise.
			break;
			case 'O':                                                      // Difference to Greenwich time (GMT) in hours Example: +0200
			break;
			case 'P':                                                      // Difference to Greenwich time (GMT) with colon between hours and minutes (added in PHP 5.1.3) Example: +02:00
			break;
			case 'T':                                                      // Timezone setting of this machine Examples: EST, MDT ...
			break;
			case 'Z':                                                      // Timezone offset in seconds. The offset for timezones west of UTC is always negative, and for those east of UTC is always positive. -43200 through 43200
			break;

			// Full Date/Time
			case 'c':                                                      // ISO 8601 date (added in PHP 5) 2004-02-12T15:19:21+00:00
			break;
			case 'r':                                                      // RFC 2822 formatted date Example: Thu, 21 Dec 2000 16:01:07 +0200
			break;
			case 'U':                                                      // Seconds since the Unix Epoch (January 1 1970 00:00:00 GMT) See also time()
			break;

			default:
				result = character;
			break;
		}
		output += result;
	}
	return output;
}
