/**
 * kClonable (better than Clonable, and half the fat!)
 *
 * @see prototype.js
 * @see prototype_ss.js
 * @see behaviour.js
 *
 * Each of the upload blocks must be marked with a
 * class of "clone" and will provide a model for
 * cloned fields. It may be marked as display: none
 * if necessary, as it will be set to block on clone.
 *
 * The immediate parent node of any element marked
 * "clone" is assumed to be the container for that
 * set.
 *
 * A comment of <!--clone:insertAfter--> or <!--
 * clone:insertBefore--> is used to mark the new
 * clone insertion point.
 *
 * An element with a class of "clone_new" within the
 * container acts as a button to add a new clone to
 * the set.
 *
 * An element with a class of "clone_del" within a
 * clone acts as a button to delete that clone.
 */
var kClonable = Class.create();
kClonable.prototype = {
	occupieds: [],                                                                     // A global registry of occupied main containers, prevents instances of kClonable from attaching to the same main container.

	initialize: function(prefs) {
		this.clones = [];                                                                // Clone registry
		this.debug = true;                                                               // Display error messages?
		this.model = null;                                                               // Serves as the model from which to create all other clones
		this.insertionPoint = {};                                                        // Where and how to insert clones
		this.p = {                                                                       // Preferences
			container: null,                                                               // Holds all clones
			afterClone: function() {}                                                      // Callback to execute on a clone before it has been inserted (for instance, to clear input fields or something). Receives the clone node as argument.
		};
		for (key in prefs) {
			this.p[key] = prefs[key];
		}

		// Check registry
		if (this.occupieds.inArray(this.p.container) != -1) {
			//this.error('Container already occupied.');
			return false;
		} else {
			this.occupieds.push(this.p.container);
		}

		var clones = document.getElementsByClassName('clone', this.p.container);         // Find all clones already existing
		this.model = clones[0].cloneNode(true);                                          // Set the model from which to clone
		for (var x=0; x<clones.length; x++) {                                            // With each one...
			var deleteButtons = document.getElementsByClassName('clone_del', clones[x]);   // Find any delete buttons
			this.clones.push({                                                             // Record this clone
				id: this.clones.length,
				node: clones[x],
				deleteButtons: deleteButtons
			});
			for (var y=0; y<deleteButtons.length; y++) {                                   // Activate delete buttons
				Event.observe(deleteButtons[y], 'click', this.deleteClone.bind(this, this.clones[this.clones.length-1]));
			}
		}

		// Locate insertion point
		var insertAfter = DOM.findFlag('clone:insertAfter', this.p.container);
		var insertBefore = DOM.findFlag('clone:insertBefore', this.p.container);
		if (insertAfter) {
			this.insertionPoint = {
				node: insertAfter,
				where: 'after'
			};
		} else if (insertBefore) {
			this.insertionPoint = {
				node: insertBefore,
				where: 'before'
			};
		} else {
			this.error('Could not locate insertion point. See documentation.');
		}

		// Locate add button
		var addButtons = document.getElementsByClassName('clone_add', this.p.container);
		if (addButtons.length) {
			for (var x=0; x<addButtons.length; x++) {
				Event.observe(addButtons[x], 'click', this.addClone.bind(this));
			}
		} else {
			this.error('No ADD button found.');
		}
	},

	deleteClone: function(which) {
		var foundClone = false;
		for (var x=0; x<this.clones.length; x++) {
			if (this.clones[x].id == which.id) foundClone = x;
		}
		if (foundClone !== false) {
			which.node.parentNode.removeChild(this.clones[foundClone].node);
			this.clones.splice(foundClone, 1);
		} else {
			//this.error('Could not find clone #'+which.id+' in the clone list.');
		}
	},

	addClone: function() {
		var newClone = this.model.cloneNode(true);                                       // Clone the model
		try {
			this.p.afterClone(newClone);                                                   // Call the callback the user may have supplied
		} catch(e) {
			this.error('afterClone callback threw an exception:\n"'+e.message+'"');
		}

		// Activate any delete buttons contained therein, and push this clone to the list
		var deleteButtons = document.getElementsByClassName('clone_del', newClone);
		this.clones.push({                                                               // Record this clone
			id: this.clones.length,
			node: newClone,
			deleteButtons: deleteButtons
		});
		for (var y=0; y<deleteButtons.length; y++) {                                     // Activate delete buttons
			Event.observe(deleteButtons[y], 'click', this.deleteClone.bind(this, this.clones[this.clones.length-1]));
		}

		switch(this.insertionPoint.where) {                                              // Insert it in the right spot.
			case 'after':
				newClone = DOM.insertAfter(newClone, this.insertionPoint.node);
			break;
			case 'before':
				newClone = this.insertionPoint.node.parentNode.insertBefore(newClone, this.insertionPoint.node);
			break;
		}
		if (!Element.visible(newClone)) {
			newClone.style.display = 'block';                                              // Mark it display: block IF currently display: none
		}
	},

	error: function(text) {
		if (this.debug) alert('kClonable Error:\n----------------------\n'+text);
	}
};
Behaviour.register({
	'.clone': function(el) {
		new kClonable({
			container: el.parentNode,
			afterClone: function(node) {}
		})
	}
});
