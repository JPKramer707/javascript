/**
 * InputCondition
 * by Kramer 051227
 *
 * Conditionally removes or un-removes a node branch based on the value
 * of a given input element.
 *
 * @param conditional DOMNODE  The form element to monitor for changes
 * @param hider       DOMNODE  The element to add/remove based on conditional's value
 * @param conditions  OBJECT   A list of true/false conditions keyed on
 *                             possible input values.  'default' is a
 *                             reserved key name, indicating the default
 *                             shown/hidden state when the user's input
 *                             does not match any which are explicitly listed.
 *                             Condition keys are case-insensitive.
 *                             Example:
 *                               {
 *                                 'default': false,
 *                                 yes: true,
 *                                 no: false,
 *                                 maybe: true
 *                               }
 *
 * @see prototype.js
 */
function kConditionalInput(s) {
	this.settings        = s;
	this.n_hiderClone    = null;                                       // A clone of a "hidden" node
	this.n_placeHolder   = null;                                       // A node put in place of the removed node
	this.displayMode     = 'block';
	this.visible         = null;
	this.s = {
		n_conditional: null,                                             // The form element whose determines n_hider's presence
		n_hider:       null,                                             // The node to add/remove
		conditions:    {                                                 // The conditions parameter.
			'default': false
		},
		action:        'hide'
	};
	for (var key in s) this.s[key] = s[key];

	this.construct = function() {
		//if (!isanode(this.s.n_hider)) return this.error('Hider is not a node.');
		//if (!isanode(this.s.n_conditional)) return this.error('Hider is not a node.');
		// Hook el onchange
		if (this.s.n_conditional.length) {                                        // Must be a radio button set
			for (var x=0; x<this.s.n_conditional.length; x++) {
				Event.observe(this.s.n_conditional[x], 'click', this.onchange.bind(this));
			}
		} else {
			Event.observe(this.s.n_conditional, 'change', this.onchange.bind(this));
		}
		this.onchange();
	}

	this.onchange = function() {
		var conditional = this.s.n_conditional;
		if (conditional.length) {                                        // Must be a radio button set
			for (var x=0; x<conditional.length; x++) {
				if (conditional[x].checked) {
					conditional = conditional[x];
					break;
				}
			}
		}
		var newVal = conditional.value.toLowerCase();
		var add = (this.s.conditions[newVal]) ? true : false;

		if (this.s.conditions[newVal] && (!this.s.n_hider || this.visible == false)) {  // If it should be present and it is removed...
			//if (!isanode(this.n_placeHolder)) return this.error('n_placeHolder is not a DOM node');
			//if (!isanode(this.n_placeHolder.parentNode)) return this.error('n_placeHolder.parentNode is not a DOM node');
			if (this.s.action == 'remove') {
				this.s.n_hider = this.s.n_hiderClone.cloneNode(true);
				this.n_placeHolder.parentNode.replaceChild(this.s.n_hider, this.n_placeHolder);
				this.s.n_hiderClone = null;
				this.n_placeHolder = null;
			} else {
				this.visible = true;
				this.s.n_hider.style.display = this.displayMode;
			}
		} else if (!this.s.conditions[newVal] && (this.s.n_hider || this.visible == true)) { // If it should be removed and it is not...
			if (this.s.action == 'remove') {
				this.n_placeHolder = document.createComment('kConditionalInput: a hider goes here');
				this.s.n_hiderClone = this.s.n_hider.cloneNode(true);
				this.s.n_hider.parentNode.replaceChild(this.n_placeHolder, this.s.n_hider);
				this.s.n_hider = null;
			} else {
				this.visible = false;
				this.displayMode = this.s.n_hider.style.display;
				this.s.n_hider.style.display = 'none';
			}
		}
	}

	this.error = function(text) {
		alert('kConditionalInput(): '+text);
		return false;
	}

	this.construct();
}
