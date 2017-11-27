var kStyle = {
	rules: [],

	/**
	 * Reads in style from style sheets based on a given selector
	 */
	getRuleBySelector: function(selector) {
		var rules = this.getDocumentRules();
		for (var x=0; x<rules.length; x++) {
			if (rules[x].selectorText) {
				if (rules[x].selectorText.toLowerCase() == selector.toLowerCase()) return rules[x];
			}
		}
		return false;
	},

	getDocumentRules: function() {                                     // Grabs all rules for this document
		if (this.rules.length == 0) this.rules = this.getAllRules(document.styleSheets);
		return this.rules;
	},

	getAllRules: function(sheets) {		                                 // Grabs all rules, on given style sheets
		if (!sheets.length) sheets = [sheets];
		var cssRules = (document.all) ? 'rules' : 'cssRules';
		var rules = [];
		for (var sheetNo=0; sheetNo<sheets.length; sheetNo++) {
			var sheet = sheets[sheetNo];
			if (sheet.imports) {
				for (var x=0; x<sheet.imports.length; x++) rules = rules.concat(this.getAllRules(sheet.imports[x]));
			}
			for (var x=0; x<sheet[cssRules].length; x++) {
				var rule = sheet[cssRules][x];
				if (rule.type == 3) {                                        // CSS Import rule
					rules = rules.concat(this.getAllRules(rule.styleSheet));
				} else {
					rules.push(rule);
				}
			}
		}
		return rules;
	}
}
