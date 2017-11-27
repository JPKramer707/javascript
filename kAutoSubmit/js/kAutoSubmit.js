/**
 * Sets any SELECT elements which have a class of 'autosubmit' to automatically
 * submit their parental form when their value is changed.
 */
Behaviour.register({
	'select.kAutoSubmit' : function(el) {
		var form = DOM.getAncestorsByTagName(el, 'form')[0];
		var select = el;
		Event.observe(select, 'change', function() { form.submit(); });
	}
});