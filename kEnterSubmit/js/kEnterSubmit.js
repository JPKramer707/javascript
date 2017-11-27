/**
 * Sets any INPUT or TEXTAREA elements which have a class of "entersubmit" to automatically
 * submit their parental form when the ENTER key is pressed in them
 * @see prototype.js
 * @see prototype_ss.js
 * @see behaviour.js
 */
Behaviour.register({
	'input.kEnterSubmit' : function(el) {
		var form = DOM.getAncestorsByTagName(el, 'form')[0];
		var input = el;
		Event.observe(input, 'keypress',
			function(e) {
				// This first conditional, checking for the existence of the entersubmit
				// class on the input, helps autocomplete and entersubmit to work together.
				// Basically, if you take the "entersubmit" class off the input element
				// temporarily, then it will disable this function, allowing the enter
				// key to be trapped for other purposes without the form being inadvertently
				// submitted.
				if (Element.hasClassName(input, 'kEnterSubmit')) {
					var keycode;
					if (window.event) keycode = window.event.keyCode;
					else if (e) keycode = e.which;
					else return true;
					if (keycode == 13) form.submit();
				}
			}
		);
	}
});