/**
 * Applies to any text fields with a class of "kClearText"
 * Automatically clears out the default text on focus.
 * Replaces the default text on blur, if no changes were made.
 */
function kClearText(el) {
	this.el = el;
	this.initialText = el.value;

	Event.observe(el, 'focus', function() {
		if (el.value == this.initialText) {                              // Text hasn't been changed yet
			el.value = '';
		} else {			                                                   // Text has been changed
			Element.removeClassName(el,'unchanged');
		}
	}.bind(this));

	Event.observe(el, 'blur', function() {
		if (el.value == this.initialText || el.value == '') {			       // No change
			el.value = this.initialText;
			Element.addClassName(el,'unchanged');
		} else {			                                                   // Change
			Element.removeClassName(el,'unchanged');
		}
	}.bind(this));
}
Behaviour.register({
	'input.kClearText' : function(el) {
		new kClearText(el);
	}
});
