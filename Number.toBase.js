Number.prototype.toBase(base) {
	// Converts any number to an arbitrary base numbering system
	var charTable = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
	if (number < base) {
		return charTable.charAt(number);
	} else {
		var MSD = '' + Math.floor(number / base);
		var LSD = number - MSD*base;
		if (MSD >= base) {
			var output = returnBase(MSD,base) + charTable.charAt(LSD);
		} else {
			var output = charTable.charAt(MSD) + charTable.charAt(LSD);
		}
	}
	return output;
}