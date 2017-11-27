var kStyle = {
	/**
	 * Reads in style from style sheets based on a given selector
	 * IE ONLY for now. Should be adaptable to real browsers eventually.
	 */
	getClassStyle: function(selector) {
		var cssRules = (document.all) ? 'rules' : 'cssRules';

		for (var sheet=0; sheet<document.styleSheets.length; sheet++){
			for (var importNo=0; importNo<document.styleSheets[sheet].imports.length; importNo++) {
				var thisImport = document.styleSheets[sheet].imports[importNo];
				var rules = thisImport[cssRules];
				for (var rule=0; rule<rules.length; rule++) {
					if (typeof(rules[rule].selectorText)) {
						if (rules[rule].selectorText == selector) {
							return rules[rule].style;
						}
					}
				}
			}
		}
		return false;
	},

}
