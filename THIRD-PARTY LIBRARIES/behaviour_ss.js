/**
 * Alters Behaviour to check for previous event assignments
 * prior to applying them; prevents duplicates.
 *
 * @see Prototype.js
 */
Behaviour.functionList = new Array; // Retains a list of all functions applied, to help track redundancy
Behaviour.applyOnce = function() {
	Behaviour.apply(true);
};

/**
 *
 * @param  once BOOL If a function in this behaviour sheet has already been
 *                   applied, shall we skip application of it this time?
 *                   Allows one to refresh the page, in the case of changed
 *                   content, so that newly-arrived elements can receive application
 *                   of the sheets which were registered before onLoad() fired.
 *                   Tantamount to: "Re-apply all previously-registered sheets,
 *                   except don't apply them to elements that have already
 *                   accepted application of them."
 */
Behaviour.apply = function(once) {
	for (var h=0;sheet=Behaviour.list[h];h++){
		for (selector in sheet){
			list = document.getElementsBySelector(selector);

			if (!list){
				continue;
			}

			for (var i=0;element=list[i];i++){
				var funct = sheet[selector];
				var needsEvent = true;
				var functId = Behaviour.functionList.inArray(funct);
				if (functId == -1) { // If function has not already been processed...
					Behaviour.functionList.push(funct);                    // Save this function
					functId = Behaviour.functionList.length-1;             // Get its ID
				}
				var className = 'hasBehaviourNo'+functId;
				if (!Element.hasClassName(element, className) || !once) {
					//debug('Applying '+functId+' to '+makeTag(element));
					Element.addClassName(element, className)
					funct(element);
				} else {
					//debug('Skipping, has the class.\n'+className+'\n'+makeTag(element));
				}
			}
		}
	}
};
