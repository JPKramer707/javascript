var kNarrowDown = Class.create();
kNarrowDown.prototype = {
	initialize: function(s) {
		this.settings = s;
		this.selects = [];
		this.values = {};
		this.s = {
			selects: []
		};
		for (var key in s) this.s[key] = s[key];

		// Assign onChange to each selector
		for (var x=0; x<this.s.selects.length; x++) {

			// Get all options for this select
			var options = [];
			var optionNodes = this.s.selects[x].getElementsByTagName('option');
			for (var y=0; y<optionNodes.length; y++) {
				if (DOM.isNode(optionNodes[y])) {
					var option = {
						hideIf: DOM.getClassData('hideIf', optionNodes[y]),
						showIf: DOM.getClassData('showIf', optionNodes[y]),
						node: optionNodes[y]
					};
					options.push(option);
				}
			}

			// Get info on the select itself
			var node = this.s.selects[x];
			var selector = {
				node: node,
				name: node.name,
				selected: node.options[node.selectedIndex],
				options: options,
				onChange: null
			};
			selector.onChange = Event.observe(node, 'change', this.selectChanged.bind(this, selector));
			this.selects.push(selector);
			this.selectChanged(selector);
		}
	},

	selectChanged: function(select) {
		select.selected = select.node.options[select.node.selectedIndex];// Update selected option
		this.values[select.name] = select.selected.value;                // Update the values table

		for (var x=0; x<this.selects.length; x++) {
			var hiddenCount = 0;
			var visibleCount = 0;
			var otherCount = 0;
			for (var y=0; y<this.selects[x].options.length; y++) {
				var option = this.selects[x].options[y];
				if (option.hideIf) {
					if (this.evaluate(option.hideIf)) {
						this.showOption(option, false);
						hiddenCount++;
					} else {
						this.showOption(option, true);
						visibleCount++;
					}
				} else if (option.showIf) {
					if (this.evaluate(option.showIf)) {
						this.showOption(option, true);
						visibleCount++;
					} else {
						this.showOption(option, false);
						hiddenCount++;
					}
				} else {
					otherCount++;
				}
			}
			if (visibleCount == 0 && otherCount == 0) {
				Element.addClassName(this.selects[x].node, 'disabled');
				this.selects[x].node.setAttribute('disabled', 'disabled');
			} else {
				Element.removeClassName(this.selects[x].node, 'disabled');
				this.selects[x].node.removeAttribute('disabled', 'disabled');
			}
		}
	},

	showOption: function(option, show) {
		if (show && option.hidden) {                                     // Show
			DOM.replace(option.node, option.nodeCopy);
			option.node = option.nodeCopy;
			option.hidden = false;
		} else if((!show) && (!option.hidden)) {                         // Hide
			var placeHolderNode = document.createComment('placeHolder');
			option.nodeCopy = option.node.cloneNode(true);
			DOM.replace(option.node, placeHolderNode);
			option.node = placeHolderNode;
			option.hidden = true;
		}
		return true;
	},

	evaluate: function(string) {
		var trySets = string.split('&');
		var result = true;
		for (var x=0; x<trySets.length; x++) {
			var bits = trySets[x].split('=');
			var values = bits[1].split('|');

			var OrResult = false;
			for (var y=0; y<values.length; y++) {
				if (this.values[bits[0]] == values[y]) {
					OrResult = true;
					break;
				}
			}
			result = OrResult;
		}
		return result;
	}
};