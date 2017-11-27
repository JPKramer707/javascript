// EventSelectors
// Copyright (c) 2005-2006 Justin Palmer (http://encytemedia.com)
// Examples and documentation (http://encytemedia.com/event-selectors)
//
// EventSelectors allow you access to Javascript events using a CSS style syntax.
// It goes one step beyond Javascript events to also give you :loaded, which allows
// you to wait until an item is loaded in the document before you begin to interact
// with it.
//
// Inspired by the work of Ben Nolan's Behaviour (http://bennolan.com/behaviour)
//
// Permission is hereby granted, free of charge, to any person obtaining
// a copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to
// permit persons to whom the Software is furnished to do so, subject to
// the following conditions:
//
// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
// LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
// OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
//

// Modified by Grady and Kramer of SolutionSet
var EventSelectors = {
	version: '1.0_pre',
	cache: [],
	rules: [],
	funcs: [],
	nodes: [],

	register : function(rules) {
		this.rules.push(rules);
	},

	apply : function() {
		this._unloadCache();
		for (var x=0; x<this.rules.length; x++) {
			var rules = this.rules[x];
			this.timer = new Array();
			this.assign(rules);
		}
	},

	addLoadEvent : function(func) {
		var oldonload = window.onload;
		if (typeof window.onload != 'function') {
			window.onload = func;
		} else {
			window.onload = function() {
				oldonload();
				func();
			}
		}
	},

	start: function() {
		this.addLoadEvent(function(){
			EventSelectors.apply();
		}.bind(this));
	},

	assign: function(rules) {
		for (var key in rules) {
			var rule = {
				key: key,
				value: rules[key]
			};
			var selectors = $A(rule.key.split(','));
			for (var x=0; x<selectors.length; x++) {
				var selector = selectors[x];
				var pair = selector.split(':');
				var event = pair[1];
				var elements = $$(pair[0]);
				for (var y=0; y<elements.length; y++) {
					var element = elements[y];
					if(pair[1] == '' || pair.length == 1) {
						var funcId = this.funcs.indexOf(rule.value);
						if(funcId == -1) {
							this.funcs.push(rule.value);
							funcId = this.funcs.length-1;
						}
						if (!this.nodes[funcId])
							this.nodes[funcId] = [];
						if (this.nodes[funcId].indexOf(element) == -1) {
							this.nodes[funcId].push(element);
							rule.value(element);
						}
						continue;
					}
					if(event.toLowerCase() == 'loaded') {
						this.timer[pair[0]] = setInterval(function(element, timer, rule) {
							var node = $(element);
							if(element.tagName != 'undefined') {
								clearInterval(this.timer[timer]);
								rule.value(node);
							}
						}.bind(this, element, pair[0], rule), 15);
					} else {
						var observer = function(event) {
							var element = Event.element(event);
							if (element.nodeType == 3)                             // Safari Bug (Fixed in Webkit)
								element = element.parentNode;
							rule.value($(element), event);
						}
						this.cache.push([element, event, observer]);
						Event.observe(element, event, observer);
					}
				}
			}
		}
	},

	// Scoped caches would rock. (what does that mean?)
	_unloadCache: function() {
		if (!this.cache) return;
		for (var i = 0; i < this.cache.length; i++) {
			Event.stopObserving.apply(this, this.cache[i]);
			this.cache[i][0] = null;
		}
		this.cache = [];
	}
}

// Remove/Comment this if you do not wish to reapply Rules automatically
// on Ajax request.
//Ajax.Responders.register({
//	onComplete: function() { EventSelectors.apply();}
//});

EventSelectors.start();

Behaviour = EventSelectors; // For old code that expects Behaviour
addLoadEvent = EventSelectors.addLoadEvent;