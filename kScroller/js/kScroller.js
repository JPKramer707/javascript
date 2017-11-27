function kScroller(settings) {
	this.settings = settings;
	this.interval = null;
	this.rollPos = 0;
	this.startPos = 0;
	this.endPos = 0;
	this.paused = false;
	this.dir = {};
	this.events = [];
	this.cloneChunk = 0;
	this.pad = 0;
	this.p = {
		collectGarbageAt: 20,
		delay: 20,                                                       // Delay between incrementations
		increment: 1,                                                    // Number of px to move per delay cycle
		n_roll: null,                                                    // Node which will be scrolled within its container
		n_container: null,                                               // n_roll's container
		startBlank: false,                                               // Start with a blank page, scrolling the roll into it? (alternative is to have the roll showing when the scroll starts)
		endBlank: true,
		direction: 'up',                                                 // Direction to move in - only fully works for 'up' right now.
		c_afterFinish: function() {},                                    // Callback function to execute after one complete movement of n_roll has completed
		c_beforeStart: function() {},                                    // Callback function to execute before beginning the scroll
		seamlessSelector: '',                                            // A CSS-style selector which can be used to return an enumeration of elements which will be shuffled in the seamless effect
		pauseOnMouseoverSelector: false,                                 // If STRING, this selector specifies what elements, when hovered, will cause the scroller to pause until mouseout. MEMORY LEAK IN IE if you use this.
		pauseOnMouseover: false,                                         // BOOL - if true, the scrolling will pause when you mouseover n_container
		overscroll: 0                                                    // Number of px to buffer the scrolled n_roll node at both ends
	};

	this.initialize = function() {
		for (var key in this.settings) this.p[key] = this.settings[key];

		// Figure out directions
		this.attribute = (this.p.direction == 'up' || this.p.direction == 'down') ? 'top' : 'left';
		this.increment = (this.p.direction == 'down' || this.p.direction == 'right') ? this.p.increment : -this.p.increment;

		this.p.n_container.style.position = 'relative';
		this.p.n_container.style.overflow = 'hidden';
		this.p.n_roll.style.position = 'absolute';

		if (this.p.startBlank) {
			this.startPos = this.getSize(this.p.n_container)+this.p.overscroll;
			this.startPos = (this.increment > 0) ? this.startPos : -this.startPos;
		}
		this.endPos = -this.getSize(this.p.n_roll)-this.p.overscroll;
		this.endPos = (this.increment > 0) ? -this.endPos : this.endPos;

		this.refreshEvents();

		if (this.p.pauseOnMouseover) {
			// Assign pause event on container
			this.events.push(Event.observe(this.p.n_container, 'mouseover', this.pause.bind(this, true)));
			this.events.push(Event.observe(this.p.n_container, 'mouseout', this.pause.bind(this, false)));
		}

		this.roll(this.startPos);                                        // Initialize the roll position
		this.p.c_beforeStart(this);                                      // Execute callback
		this.pause(false);                                               // Begin the scrolling
	}

	this.refreshEvents = function() {
		// Handle events
		if (this.p.pauseOnMouseoverSelector && !this.p.pauseOnMouseover) {
			while (this.events.length) Event.unObserve(this.events.pop()); // Kill old events
			var applicable = document.getElementsBySelector(this.p.pauseOnMouseoverSelector, this.p.n_roll);
			for (var x=0; x<applicable.length; x++) {
				this.events.push(Event.observe(applicable[x], 'mouseover', this.pause.bind(this, true)));
				this.events.push(Event.observe(applicable[x], 'mouseout', this.pause.bind(this, false)));
			}
		}
	}

	this.roll = function(amount, timerID) {
		this.rollPos += amount;

		var data = this.posInfo();

		if (this.p.seamlessSelector) {
			if (data.endVisible) {                                         // Execute a DOM manip for seamless continuation
				if (this.cloneChunk > this.p.collectGarbageAt) {             // Garbage collection
					var chunks = document.getElementsBySelector(this.p.seamlessSelector, this.p.n_roll);
					var preSize = this.getSize(this.p.n_roll);
					for (var x=0; x<this.p.collectGarbageAt; x++) {
						DOM.remove(chunks[x]);
					}
					var postSize = this.getSize(this.p.n_roll);
					this.rollPos += (preSize-postSize);
					this.cloneChunk = 1;
				}

				var chunks = document.getElementsBySelector(this.p.seamlessSelector, this.p.n_roll);
				var moving = chunks[this.cloneChunk].cloneNode(true);        // Clone
				DOM.insertAfter(moving, chunks[chunks.length-1]);            // Add the chunk to the end of the roll
				this.refreshEvents();
				this.cloneChunk++;
			}
		} else {
			if (data.done) {
				this.p.c_afterFinish(this);
				if (this.p.loop) {
					this.rollPos = this.startPos;
				} else {
					this.pause(true);
				}
			}
		}
		this.p.n_roll.style[this.attribute] = (this.rollPos+this.pad) + 'px';
	}

	this.posInfo = function() {
		var data = {
			rollPos      : Position.cumulativeOffset(this.p.n_roll),
			containerPos : Position.cumulativeOffset(this.p.n_container),
			rollSize     : this.getSize(this.p.n_roll),
			containerSize: this.getSize(this.p.n_container)
		};
		data.rollPos = {
			top:    data.rollPos[1],
			left:   data.rollPos[0],
			bottom: data.rollPos[1]+data.rollSize,
			right:  data.rollPos[0]+data.rollSize
		};
		data.containerPos = {
			top:    data.containerPos[1],
			left:   data.containerPos[0],
			bottom: data.containerPos[1]+data.containerSize,
			right:  data.containerPos[0]+data.containerSize
		};
		switch (this.p.direction) {
			case 'up':
				data.endVisible = (data.rollPos.bottom <= data.containerPos.bottom);
				data.done = (data.rollPos.bottom <= data.containerPos.top);
			break;
			case 'down':
				data.endVisible = (data.rollPos.bottom >= data.containerPos.bottom);
				data.done = (data.rollPos.top    >= data.containerPos.bottom);
			break;
			case 'left':
				data.endVisible = (data.rollPos.left   >= data.containerPos.left);
				data.done = (data.rollPos.left   >= data.containerPos.right);
			break;
			case 'right':
				data.endVisible = (data.rollPos.right  <= data.containerPos.right);
				data.done = (data.rollPos.right  <= data.containerPos.left);
			break;
		}
		return data;
	}

	this.getSize = function(el) {
		return (this.p.direction == 'up' || this.p.direction == 'down') ? Element.getHeight(el) : Element.getDimensions(el).width;
	}

	this.pause = function(on) {
		clearInterval(this.interval);
		this.interval = null;
		if (!(this.paused = on)) {
			this.interval = setInterval(this.roll.bind(this, this.increment), this.p.delay); // Get things rolling
		}
	}

	this.initialize();
}