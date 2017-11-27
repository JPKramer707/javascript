function kNumberBox(s) {
	/* kNumberBox
	 *
	 * TODO:
	 *   ctrl/shift tapping
	 *   use width of input at initialize to determine size, subtract button width
	 */
	this.settings = s;
	this.selectedOption = 0;
	this.t_repeat = null;
	this.currentValue = null;
	this.s = {
		node: null,
		imgUp: null,
		imgDown: null,
		amount_ctrl: 10,
		amount_shift: 20,
		waitBeforeRepeat: 500,
		repeatDelay: 50,
		max: null,
		min: null,
		options: null,
		validate: null,
		increment: 1
	};

	this.initialize = function(s) {
		for (var key in s) this.s[key] = s[key];

		var nContainer = document.createElement('span');
		Element.addClassName(nContainer, 'kNumberBox');
		nContainer.style.position = 'relative';
		var html = '';

		// Insert DOM nodes
		html += '<input type="text" class="'+this.s.node.className+'" value="'+this.s.node.value+'" style="position: relative;" />\n';
		if (this.s.imgUp) {
			html += '<img src="'+this.s.imgUp+'" class="btnUp" style="position: absolute;" />\n';
		} else {
			html += '<p>+</p>\n';
		}
		if (this.s.imgDown) {
			html += '<img src="'+this.s.imgDown+'" class="btnDown" style="position: absolute;" />\n';
		} else {
			html += '<p style="" >-</p>\n';
		}
		nContainer.innerHTML = html;
		DOM.replace(this.s.node, nContainer);

		var imgs = nContainer.getElementsByTagName('img');
		this.s.node = nContainer.getElementsByTagName('input')[0];

		// Adjust input dimensions to accomodate new buttons without growing.
		var inputSize = Element.getDimensions(this.s.node);
		var imgSize = Element.getDimensions(imgs[0]);
		this.s.node.style.width = (inputSize.width-imgSize.width)+'px';
		// Since the images don't count toward flow, we need to nudge the input's padding to compensate.
		this.s.node.style.marginRight = (imgSize.width-4)+'px';

		// Position the images where they need to be
		var inputPos = Position.cumulativeOffset(this.s.node);
		var containerPos = Position.cumulativeOffset(nContainer);
		var pos = {
			x: inputPos[0]-containerPos[0],
			y: inputPos[1]-containerPos[1]
		};
		var inputSize = Element.getDimensions(this.s.node);
		imgs[0].style.left = (pos.x+inputSize.width-2)+'px';
		imgs[1].style.left = (pos.x+inputSize.width-2)+'px';
		imgs[0].style.top = (pos.y-1)+'px';
		imgs[1].style.top = (pos.y+9)+'px';


		// Attach events
		Event.observe(imgs[0], 'mousedown', this.mouseDown.bind(this, 'up'));
		Event.observe(imgs[1], 'mousedown', this.mouseDown.bind(this, 'down'));
		Event.observe(imgs[0], 'mouseup', this.mouseUp.bind(this, 'up'));
		Event.observe(imgs[1], 'mouseup', this.mouseUp.bind(this, 'down'));
		Event.observe(this.s.node, 'keypress', this.keyPress.bind(this));
		Event.observe(this.s.node, 'blur', this.onBlur.bind(this));

		this.bump(0); // Assure that value is in range
	};

	this.mouseUp = function(e) {
		clearInterval(this.t_repeat);
		this.t_repeat = null;
	};

	this.mouseDown = function(direction, e) {
		var amount = (direction == 'up') ? this.s.increment : -this.s.increment;
		this.bump(amount);
		this.t_repeat = setTimeout(function(amount) {
			if (HID.p.buttonDown()) {
				this.bump(amount);
				this.t_repeat = setInterval(function(amount) {
					if (HID.p.buttonDown()) {
						this.bump(amount);
					} else {
						clearInterval(this.t_repeat);
						this.t_repeat = null;
					}
				}.bind(this, amount), this.s.repeatDelay);
			}
		}.bind(this, amount), this.s.waitBeforeRepeat);
	};

	this.onBlur = function(e) {
		if (this.s.validate instanceof Function) {                       // Functional text validator
			var result = this.s.validate(this.s.node.value);
		} else if (this.s.validate != null) {                            // Regex text validator
			var result = (this.s.node.value.match(this.s.validate));
		}
		if (result) {
			this.currentValue = this.s.node.value;
		} else {
			this.s.node.value = this.currentValue;
		}
	};

	this.keyPress = function(e) {
		var change = 0;
		switch(Event.keyCode(e)) {
			case 38: // up
				change = this.s.increment;
			break;
			case 40: // down
				change = -this.s.increment;
			break;
		}
		if (change != 0) {
			this.bump(change);
			if (!e) var e = window.event;
			e.cancelBubble = true;
			if (e.stopPropagation) e.stopPropagation();
		}
	};

	this.bump = function(amount, noselect) {
		if (!this.s.options) {
			var newVal = parseInt(this.s.node.value)+parseInt(amount);
			if (this.s.max != null) newVal = Math.min(this.s.max, newVal);
			if (this.s.min != null) newVal = Math.max(this.s.min, newVal);
			if (isNaN(newVal)) newVal = '';
			this.s.node.value = newVal
			if (!noselect) this.s.node.select();
		} else {
			var newSelectedOption = this.selectedOption+parseInt(amount);
			newSelectedOption = Math.min(newSelectedOption, this.s.options.length-1);
			newSelectedOption = Math.max(newSelectedOption, 0);
			this.selectedOption = newSelectedOption;
			this.s.node.value = this.s.options[this.selectedOption];
		}
		this.currentValue = this.s.node.value;
	};

	this.initialize(s);
}
