kConditionalInput
By Kramer 051227-060807

A. Description:
	Conditionally removes or un-removes a DOM node branch
	based on the value of a given input element.

B. Terminology:
	CONDITIONAL: The HTML node (or tag) whose value will
							 control the presence of another node.  This
							 is a form input field that you want to use to
							 turn another node on and off.

				HIDER: The HTML node (or tag) that will appear and
							 disappear based on the value of CONDITIONAL.

C. Implementation Instructions:

	1) Upload the included javascript files, namely:
				- prototype.js
				- EventSelectors.js
				- kConditionalInput.js

	2) Include those javascript files in your HTML.

	3) In the HTML, tag the HIDER with an id attribute.  You
		 can set it to anything you want, just remember that value.

	4) Create a CSS selector which selects the CONDITIONAL.

	5) Now, create a EventSelectors rule (see EventSelectors.js) which
		 uses your new CSS selector and HIDER's id attribute,
		 following the example given:

				01  conditions = {
				02    '#00N00000006mFVx' : function(el) {
				03      new InputCondition(
				04        el,
				05        document.getElementById('hider'),
				06        {
				07          default: false,
				08          yes: true
				09        }
				10      );
				11    }
				12  };
				13
				14  EventSelectors.register(conditions);

	6) Set your conditions as desired. On lines 7 and 8
		 above, you'll find some presets. A value of "false" means that the
		 HIDER will not be shown, "true" means it will be shown.
		 Therefore, line 8 above dictates that, if CONDITIONAL
		 equals "yes" then the HIDER will be shown.  Line 7
		 dictates that if CONDITIONAL equals anything else; then
		 HIDER will not be shown.

	7) Set your onload events to use EventSelectors' onload
		 handler.  If you don't do this, then InputCondition
		 will not work!  Simply remove your onload="" attributes
		 from BODY tags and, instead, put a script in the head
		 of your HTML like this:

				01  EventSelectors.addLoadEvent(
				02    function() {
				03      //Put your onload="" code here
				04    }
				05  );
