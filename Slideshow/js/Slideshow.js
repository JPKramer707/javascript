/**
 * AJAX Slideshow
 *
 * @see prototype.js
 * @see prototype_ss.js
 * @see behaviour.js
 *
 * Takes a container and a URL to an XML slideshow definition,
 * gives a slideshow.
 *
 * Preferences can be listed in one of three places. In the order given, each location overrides the previous:
 *    1) Instantiation preferences
 *    2) XML file's global section
 *    3) XML file's slide-specific pref section
 *
 */
var Slideshow = Class.create();
Slideshow.prototype = {
	initialize: function(prefs) {
		this.slides = [];                                                // List of slides in this slideshow
		this.ajax = null;                                                // AJAX object from Prototype
		this.activeSlide = null;                                         // The slide which is currently visible
		this.timer = null;                                               // Timeout counting down to the next slide
		this.t_videoReady = null;
		this.p = {                                                       // Preferences
			container: null,
			controls: null,
			controlPlayText: 'Play',
			controlPauseText: 'Pause',                                              // The element in which the slides will be displayed
			autoStart: true,
			displaySeconds: 1,                                             // Delay between slides
			clickToAdvance: true,                                          // Clicking a slide advances to the next - precludes us from using hrefs, of course.
			clickToAdvanceStopsTimer: false,                               // Enable this if you want the click-to-advance feature to stop the automatic timered slide advancement
			shuffle: true,                                                 // Random-sequence slide change
			looping: true,                                                 // Start from beginning when the end has been reached?
			flvPlayerURL: null,                                            // URL of the FLV Player
			flvPlayDelay: 1000,                                            // ms to wait after revealing an FLV Player before attempting to locate it in the DOM. A delay is necessary to give Flash time to load up and begin accepting commands.
			flvPlayTimeout: 100000,                                          // ms to wait for an FLV to signal that it is ready to play. If it takes longer than this, skip the FLV.
			debug: false,
			ajaxUrl: null                                                  // URL at which to grab the XML slideshow script
		};

		for (key in prefs) {                                             // Load in preferences
			this.p[key] = prefs[key];
		}

		window.flvPlayerMsg = this.flvPlayerMsg.bind(this);              // Set up the FLVPlayer callback for Flash
		window.videoDone = this.flvPlayerMsg.bind(this, 'playDone');     // Set up the FLVPlayer callback for Flash
		if (this.p.controls)
			this.setupControls();
		this.loadScript(this.p.ajaxUrl);                                 // Load up the XML
	},

	setupControls: function () {
		var buttons = this.p.controls.getElementsByTagName('li');
		$A(buttons).each(function (el, index)
		{
			if (Element.hasClassName(el, 'play') || Element.hasClassName(el, 'pause'))
				Event.observe(el, 'click', this.clickPlayToggle.bind(this));
			else if (Element.hasClassName(el, 'skip'))
				Event.observe(el, 'click', this.slideOnClick.bind(this));

		}.bind(this));
	},

	clickPlayToggle: function (e) {
		var el = Event.findElement(e, 'li');
		var links = el.getElementsByTagName('a')
		if (links.length > 0) {
			var a = links[0];
			a.blur();
		}
		else
			var a = el;
		if (Element.hasClassName(el, 'play')) {
			Element.addClassName(el, 'pause');
			Element.removeClassName(el, 'play');
			this.p.clickToAdvanceStopsTimer = false;
			a.innerHTML = this.p.controlPauseText;
			clearTimeout(this.timer);
			this.timer = null;
			this.transition();
		}
		else if (Element.hasClassName(el, 'pause')) {
			Element.addClassName(el, 'play');
			Element.removeClassName(el, 'pause');
			a.innerHTML = this.p.controlPlayText;
			clearTimeout(this.timer);
			this.timer = null;
			this.p.clickToAdvanceStopsTimer = true;
		}
	},

	flvPlayerMsg: function(msg, arg) {                                 // Callback executed by Flash when a video finished playing
		//alert(msg+' '+arg);
		switch (msg) {
			case 'playDone':
				var videoID = arg;
				this.transition((this.p.clickToAdvanceStopsTimer));
			break;
			case 'ready':
				for (var x=0; x<this.slides.length; x++) {
					if (this.slides[x].id == arg) {
						/* The following is one of the strangest quirks I've ever encountered.
							 If you remove the following NO-OP loop, you'll find that (for Firefox, at least)
							 "Bad NPObject as private data!" errors will pop up in your console, and the
							 FLV videos will not play on the first few loops. I found that the placement of
							 an alert() directly before the setting of videoReady would somehow keep this issue
							 from rearing it's strange head, but, of course, we can't have alerts popping up in
							 the middle of a slideshow or the visitors will soon be coming after me with
							 noose in hand.

							 So, I tried using a setTimeout() to simulate the delay which the alert() was supplying,
							 but suprisingly, this did NOT have the same effect! I experimented with a few different
							 things which might replicate the effect of the alert... I tried calling window.blur()
							 and also adding a bit of HTML to the DOM, neither worked. Finally, I decided to
							 implement a bit of code inspired by my early days of BASIC programming: the for-loop
							 delay! Obviously, this worked.

							 It seems that JS needed its thread tied up for a while... not sure why... but JS's
							 interaction with Flash is notoriously flakey.

							 -Kramer 060621
						 */
						var y = new Date();
						do {                                                   // Delay loop
							var z = new Date();
						} while (y.getTime()+this.p.flvPlayDelay > z.getTime());
						this.slides[x].videoFirstPlay = false;
						this.slides[x].videoReady = true;
						break;
					}
				}
			break;
		}
	},

	debug: function(text) {
		if (this.p.debug) alert('Slideshow.js Says:\n\n'+text);
	},

	loadScript: function(url, parameters) {
		// Loads the XML slideshow script and begins executing it.
		this.debug('AJAX out: \n'+url+'?'+parameters);
		this.ajax = new Ajax.Request(url, {
			method: 'post',
			parameters: parameters,
			onComplete: function(req) {                                    // This code is executed when the XML returns to us
				this.debug('AJAX in:\n'+req.responseText);
				// Read in XML global preferences
				if (!req.responseXML.childNodes.length) {
					var extError = (document.all) ? ' IE does not support loading local XML files.' : '';
					this.error('Error parsing XML.'+extError);
					return false;
				}
				var globalPrefs = req.responseXML.getElementsByTagName('prefs');
				if (globalPrefs.length) {
					globalPrefs = globalPrefs[0].getElementsByTagName('pref');
					for (var x=0; x<globalPrefs.length; x++) {                   // These preferences override those given as an argument to Slideshow()
						var name = globalPrefs[x].getAttribute('name');
						var val = globalPrefs[x].getAttribute('value');
						this.p[name] = val;
					}
				}

				// Read in each slide
				var slides = req.responseXML.getElementsByTagName('slide');
				for (var x=0; x<slides.length; x++) {
					var slideInfo = {
						id: this.slides.length,
						type: slides[x].getAttribute('type'),
						url: slides[x].getAttribute('url'),
						href: slides[x].getAttribute('href'),
						alt: slides[x].getAttribute('alt'),
						displayCount: 0,
						videoReady: false,
						videoFirstPlay: true,
						p: {}
					};

					// Read in individual slide preferences
					var slidePrefs = slides[x].getElementsByTagName('pref');
					for (var y=0; y<slidePrefs.length; y++) {                 // These preferences override those given as an argument to Slideshow()
						var name = slidePrefs[y].getAttribute('name');
						var val = slidePrefs[y].getAttribute('value');
						slideInfo.p[name] = val;
					}
					this.slides.push(slideInfo);
				}

				// Write out DOM elements that will constitute each slide
				DOM.empty(this.p.container);
				if (this.slides.length == 1)
					DOM.remove(this.p.controls);
				else if (this.slides.length > 1)
					Element.show(this.p.controls);
				for (var x=0; x<this.slides.length; x++) {
					var slide = this.slides[x];                                // A short name for the current slide
					var container = document.createElement('div');             // A new container element for this slide
					// Juggle preferences
					slide.p.height = firstTrue(function(arg) {
						return (arg > 0);
					}, slide.p.height, this.p.height);
					slide.p.width = firstTrue(function(arg) {
						return (arg > 0);
					}, slide.p.width, this.p.width);

					switch(slide.type) {
						case 'image':                                            // If the slide is an IMAGE
							var width = (slide.p.width) ? ' width="'+slide.p.width+'"' : '';
							var height = (slide.p.height) ? ' height="'+slide.p.height+'"' : '';
							var html = '';
							if (slide.href && !bool(this.p.clickToAdvance)) html += '<a href="'+slide.href+'">';
							html += '<img src="'+slide.url+'" alt="'+slide.alt+'"'+height+width+' />';
							if (slide.href && !bool(this.p.clickToAdvance)) html += '</a>';
							if (bool(this.p.clickToAdvance)) {
								Event.observe(container, 'click', this.slideOnClick.bind(this));
							}
							container.innerHTML = html;
						break;
						case 'video':                                            // If the slide is a VIDEO
							var swfURL = this.p.flvPlayerURL+'?vFile='+encodeURIComponent(slide.url)+'&vID='+x;
							var html = '';
							html += ''+
								'<object classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000" codebase="http://fpdownload.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=7,0,0,0" width="'+slide.p.width+'" height="'+slide.p.height+'" id="flvplayer" align="middle">\n'+
								'	<param name="allowScriptAccess" value="sameDomain" />\n'+
								'	<param name="movie" value="'+swfURL+'" />\n'+
								'	<param name="menu" value="false" />\n'+
								'	<param name="quality" value="high" />\n'+
								'	<param name="bgcolor" value="#ffffff" />\n'+
								'	<embed src="'+swfURL+'" menu="false" quality="high" bgcolor="#ffffff" width="'+slide.p.width+'" height="'+slide.p.height+'" name="flvplayer" align="middle" allowScriptAccess="sameDomain" type="application/x-shockwave-flash" pluginspage="http://www.macromedia.com/go/getflashplayer" />\n'+
								'</object>\n'+
							'';

							this.slides[x]['html'] = html;
						break;
						default:                                                 // If the slide type is unknown
							container = false;                                     // Make the rest of the script ignore this slide.
							this.error('Unknown slide type: '+slide.type);
						break;
					}
					//Element.hide(container);                                   // Hide the slide until its time comes
					container.style.position = 'absolute';
					container.style.left = "-9999px";
					container = this.p.container.appendChild(container);       // Stick it in the DOM
					this.slides[x].node = container;                           // Save a reference to it
				}

				if (this.slides.length && this.p.autoStart && this.p.autoStart != '0') {
					this.transition();
				}
				else if (this.slides.length && (!this.p.autoStart || this.p.autoStart == '0')) {
					this.transition(true);
				}
				else {
					this.error('No slides found in XML:\n\n'+req.responseText);
				}
			}.bind(this)
		});
	},

	error: function(text) {
		alert('Slideshow error:\n----------------\n'+text);
	},

	slideOnClick: function(e) {
		var el = Event.findElement(e, 'li');
		if (el)
			el.blur();
		clearTimeout(this.timer);
		this.timer = null;
		this.transition((this.p.clickToAdvanceStopsTimer));
	},

	transition: function(disableTimer) {
		// Changes slides
		var startIndex = 0;
		if (this.activeSlide) startIndex = this.activeSlide.id+1;        // Set the starting point to be the slide right after the current slide
		if (bool(this.p.shuffle) && this.slides.length > 1) {
			var rand = null;
			while (rand == null || (this.activeSlide && rand == this.activeSlide.id)) { // Making certain that the random point we choose is NOT the one we're already on
				rand = Math.floor(Math.random()*this.slides.length);
			}
			startIndex = rand;
		}

		// Begin choosing the next candidate for slidehood
		var x = startIndex;
		var newSlide = null;
		for (var y=0; y<this.slides.length; y++) {
			if (bool(this.p.looping)) {
				if (x == this.slides.length) x = 0;
				if (x == startIndex-1) break;
			} else {
				if (x == this.slides.length) return false;                   // Cancel transitioning since we're on the final slide and looping is off
			}
			if (this.slides[x].node) {                                     // Found it
				// IE never gets here
				newSlide = this.slides[x];
				break;
			}
			x++;
		}

		if (newSlide) {
			// Determine the transition effect
			// Note that any transition function assigned to hide() or show() must support the "afterFinish" callback
			var hide = null;
			var show = null;
			if (this.activeSlide) {                                          // If a slide is active
				var effect = firstTrue(function(arg) {                         // Weigh the hierarchy of preferences to find the effect to use
					if (typeof(arg) != 'undefined') return true;
					return false;
				}, this.activeSlide.p.effect, this.p.effect);
			} else {                                                         // If this is the first slide, use the default effect
				var effect = this.p.effect;
			}
			switch(effect) {
				case 'crossfade':
					if (typeof(Effect.Fade) == 'function') {
						hide = function(element, options) {                          // Default hide function
							if (options) {
								var options2 = {};
								if (typeof(options.afterFinish) == 'function') {
									options2['afterFinish'] = function(options) {
										setTimeout(options.afterFinish, this.p.flvPlayDelay);
									}.bind(this, options);
								}
							}
							Effect.Fade(element, options2);
						}.bind(this);
					}
					if (typeof(Effect.Appear) == 'function') {
						show = function(element, options) {                          // Default show function
							if (options) {
								var options2 = {};
								if (typeof(options.afterFinish) == 'function') {
									options2['afterFinish'] = function(options) {
										setTimeout(options.afterFinish, this.p.flvPlayDelay);
									}.bind(this, options);
								}
							}
							Effect.Appear(element, options2);
						}.bind(this);
					}
				break;
			}

			// Make sure the transition will work, if not, use the default (safe) transition.
			if (typeof(hide) != 'function') var hide = function(element, options) {         // Default hide function
				Element.hide(element);
				if (options) if (typeof(options.afterFinish) == 'function') setTimeout(options.afterFinish, this.p.flvPlayDelay)
			}.bind(this);
			if (typeof(show) != 'function') var show = function(element, options) {         // Default show function
				Element.show(element);
				if (options) if (typeof(options.afterFinish) == 'function') setTimeout(options.afterFinish, this.p.flvPlayDelay);
			}.bind(this);

			// Handle special cases, like VIDEOS
			switch (newSlide.type) {
				case 'video':
					// Set up
					var disableTimer = true;
				break;
			}

			// Now, commit the transition
			if (newSlide || newSlide.type == 'video') {
				if (this.activeSlide) {                                        // If a slide is currently active (i.e. not the first in this show)
					if (newSlide.node == this.activeSlide.node) return false;    // And if that slide is the same as the one we've decided to show, then quit

					hide(this.activeSlide.node);                                 // Then hide is so we can show the new one.
				}
				var afterFinish = function() {};                               // Executed after the transition effect is complete
				if (newSlide.type == 'video') {
					newSlide.node.innerHTML = '';
					newSlide.node.innerHTML = newSlide.html;
					afterFinish = function() {
						newSlide.startedWaiting = new Date();
						this.t_videoReady = setInterval(function(newSlide) {
							var now = new Date();
							if (newSlide.startedWaiting.getTime()+this.p.flvPlayTimeout < now.getTime()) { // Timeout
								clearInterval(this.t_videoReady);
								this.transition();
							}

							if (newSlide.videoReady) {
								if (!document.all) newSlide.videoReady = false;      // IE doesn't need (or get) a ready signal on each showing of the video, only on the first. FF needs them for each showing.
								clearInterval(this.t_videoReady);
								var func = firstTrue(
									function(arg) {
										if (typeof(arg) != 'undefined') {
											if (typeof(arg[0]) != 'undefined') {
												if (typeof(arg[0].SetVariable) != 'undefined') {
													return true;
												}
											}
										}
										return false;
									},
									newSlide.node.getElementsByTagName('object'),
									newSlide.node.getElementsByTagName('embed')
								);
								try {
									func[0].SetVariable('vPlay', 'play');
								} catch(e) {
									this.error('Exception on video play');
								}
							}
						}.bind(this, newSlide), 100);
					}.bind(this, newSlide);
				}
				newSlide.displayCount++;
				Position.clone(this.p.container, newSlide.node);
				show(newSlide.node, {afterFinish: afterFinish});               // Show the new slide

				this.activeSlide = newSlide;                                   // Mark it as the new active slide

				// Set timeout to next slide
				if (!(disableTimer === true)) {
					var delay = firstTrue(function(arg) {
						return (arg);
					}, this.activeSlide.p.displaySeconds, this.p.displaySeconds);
					this.timer = setTimeout(this.transition.bind(this), delay*1000);
				}
			} else {
				// No newslide set
			}
		} else {
			//this.error('Found no new slide candidates!');
		}
	},

	destroy: function() {
		// Destructor
		clearTimeout(this.timer);
		this.timer = null;
		DOM.empty(this.p.container);
	}
};

function firstTrue(callback) {
	// Returns the first value given as an argument which the callback
	// function evalutaes as true.
	for (var x=1; x<arguments.length; x++) {
		if (callback(arguments[x])) return arguments[x];
	}
	return false;
}
