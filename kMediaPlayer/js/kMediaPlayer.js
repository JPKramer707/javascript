/**
 * kMediaPlayer
 * by Kramer 051221-060815
 *
 * An API by which a Flash Media player can be manipulated
 *
 *          mp = new MediaPlayer({
 *            stageHeight: 200,
 *            stageWidth: 20,
 *            insertStageInto: myNode,
 *            cb_time: myFunction,
 *            putControlsIn: myNode
 *          });
 *
 * @see  JavaScriptGateway.js (by Macromedia)
 * @see  behaviour.js
 * @see  behaviour.addonunload.js
 * @see  prototype.js
 * @see  detectFlash.js
 * @see  cookies.js
 * @see  Scriptaculous slider
 *
 */

function kMediaPlayer(settings) {
	this.s_flash_height            = null;                          // Height of the Flash object
	this.s_flash_width             = null;                          // ...width
	this.s_flash_lcId              = null;
	this.s_jsInstanceName          = null;                          // Name of the current instance of the JavaScript media player, whatever the new MediaPlayer() object was stored in.
	this.s_n_flash                 = null;                          // A DOM node, into which the newly-created flash object should be inserted
	this.s_playerUrlSWF            = 'mp3player_js.swf';            // Location of the Flash media player
	this.s_fProxyUrlSWF            = 'JavaScriptFlashGateway.swf';  // URL of the Flash Gateway
	this.s_progressColor           = '0xff0000';                    // Color of flash's "loading" progress bar
	this.s_playlist                = Array();                       // Array of files to play (URL)
	this.s_currentTrack            = 0;                             // Current track number
	this.s_currentPosition         = null;                          // Position within the current track
	this.s_volume                  = 100;                           // Initial volume
	this.s_isMuted                 = false;                         // BOOL - Mute state
	this.s_isStopped               = true;                          // BOOL - is the player stopped currently?
	this.s_showErrorLevel          = 0;                             // Show errors of a volume level equal to or less than this value as alerts, all others silent.
	this.s_fatalErrorLevel         = 0;                             // Stop on errors of a volume level equal to less than this value
	this.s_cb_time                 = null;
	this.s_requiredFlashVer        = 6;
	this.s_n_controls              = null;
	this.s_volumeSlider            = null;
	this.s_showVolume              = false;                         // Show a volume slider?
	this.s_saveSettingsSeconds     = 10;                            // Number of seconds that the user's between-page seek position/volume/track/etc info should be saved for them
	this.s_playOnPageLoad          = true;
	this.s_repeatPlaylist          = true;
	this.s_autoAdvanceTrack        = true;
	this.s_n_status                = null;
	this.s_n_volume                = null;                          // Node in which to display volume level
	this.s_n_time                  = null;
	this.s_n_tracklength           = null;
	this.s_playlistUrlXML          = null;

	// Flash-supplied variables
	this.s_fl_position             = null;                          // Current track position
	this.s_fl_remaining            = null;                          // Remaining time in track
	this.s_fl_mediaLength          = null;                          // Total time in track

	this.o_fProxy                  = null;
	this.o_ajax                    = null;
	this.errors                    = Array();                       // Retains a log of errors encountered by the class
	this.ctrlLoadPlaylist_onload   = null;                          // Function to execute on load of XML playlist
	this.trackTimeElapsed          = null;
	this.trackTimeStarted          = null;
	this.timer                     = null;
	this.playerReady               = false;                         // BOOL, indicates whether construction and instantiation went well
	this.currentFlashVer           = false;
	this.n_volumeTrack             = null;
	this.n_volumeHandle            = null;
	this.o_volumeSlider            = null;
	this.currentPlaylistUrl        = null;
	this.resumeTrack               = null;
	this.mediaLoadComplete         = false;
	this.ctrlSeekToValue           = null;
	this.onTrackLoaded             = Array();
	this.onBuffering               = Array();

	this.construct = function(settings) {
		// Decode cookie
		this.onload();
		this.debug("mediaPlayer loading", null, 4);
		if (this.importSettings()) {
			this.writeFlash();
		} else {
			if (this.dialog('Setup errors occurred.  Cannot continue.  Would you like to see the log?')) {
				this.errorReport();
			}
		}
		if (this.s_n_controls) {
			var x = this.createControls();
			this.s_n_controls.appendChild(x);
			if (this.s_showVolume) {
				this.o_volumeSlider = new Control.Slider(
					this.n_volumeHandle,
					this.n_volumeTrack,
					{
						onChange: this.volumeSliderChange.bind(this)
					}
				);
			}
		}

		Behaviour.addUnLoadEvent(this.onunload.bind(this));

		//var playFunc = (this.s_playOnPageLoad) ? this.ctrlPlay.bind(this) : null;
		//this.ctrlLoadPlaylist(this.s_playlistUrlXML);

		// Restore settings from the cookie, if any
		this.ctrlLoadPlaylist(this.s_playlistUrlXML, this.postConstruct.bind(this));
	}
	this.postConstruct = function() {
		if ((this.s_isStopped && this.s_playOnPageLoad) || !this.s_isStopped) {
			this.ctrlPlay();
		}
		if (this.s_isMuted) this.ctrlMute();
		//this.ctrlSetVol(this.s_volume);
		var seek = function() {
			this.ctrlSeekTo(this.s_currentPosition);
		}

		if (!this.s_playOnPageLoad) {
			this.onTrackLoaded.push(this.ctrlStop.bind(this));
			this.onBuffering.push(this.ctrlStop.bind(this));
		} else if (this.s_currentPosition) {
			// We plan to resume this track
			this.onTrackLoaded.push(seek.bind(this));
			this.onBuffering.push(this.ctrlStop.bind(this));
		} else {
			// No resume
		}
		this.ctrlSkipTo(this.s_currentTrack);

		if (typeof(this.s_cb_time) == 'function' || this.s_n_time.tagName) {
			setInterval(this.tick.bind(this), 1000);
		}
		this.playerReady = true;
	}

	this.tick = function() {
		var curTime = Math.floor(this.timerGet()/1000);
		if (typeof(this.s_cb_time) == 'function') this.cb_time(curTime);
		if (this.s_n_time.tagName) this.updateNode(this.s_n_time, curTime);
	}

	this.createControls = function() {
		this.debug("creating controls", null, 4);
		var container = document.createElement('div');
		var ctrls = {
			previous: this.ctrlPrev.bind(this),
			play: this.ctrlPlay.bind(this),
			//pause: this.ctrlPause.bind(this),
			stop: this.ctrlStop.bind(this),
			next: this.ctrlNext.bind(this) //,
			//mute: this.ctrlMute.bind(this)
		};
		var ul = document.createElement('ul');
		for (var classNom in ctrls) {
			var li = document.createElement('li');
			li.className = classNom;
			Event.observe(li, 'click', ctrls[classNom]);
			ul.appendChild(li);
		}
		container.appendChild(ul);

		if (this.s_showVolume) {
			var volumeContainer = document.createElement('div');
			volumeContainer.className = 'volume';
			this.n_volumeTrack = document.createElement('div');
			this.n_volumeHandle = document.createElement('div');
			this.n_volumeTrack.className = 'track';
			this.n_volumeHandle.className = 'handle';
			volumeContainer.appendChild(this.n_volumeTrack);
			volumeContainer.appendChild(this.n_volumeHandle);
			container.appendChild(volumeContainer);
		}


		return container;
	}

	this.volumeSliderChange = function(v) {
		this.ctrlSetVol(v);
		return true;
	}

	/**
	 * Handles a window.unload event
	 */
	this.onunload = function() {
		var delimiter = ' | ';
		this.s_currentPosition = this.timerGet();
		var serial =
			this.s_currentPosition+
			delimiter+
			this.currentPlaylistUrl+
			delimiter+
			this.s_currentTrack+
			delimiter+
			this.s_volume+
			delimiter+
			this.s_isMuted+
			delimiter+
			this.s_isStopped;
		var now = new Date();
		var expDate = new Date(now.valueOf()+(this.s_saveSettingsSeconds*1000));
		this.debug('Setting cookie: '+serial);
		SetCookie('MediaPlayerJS', serial, expDate);
		//document.cookie = "MediaPlayerJS="+escape(serial);
	}
	/*
	 * Decodes an incoming cookie, if any
	 */
	this.onload = function() {
		var cookie = null;
		if (cookie = GetCookie('MediaPlayerJS')) {
			this.debug('Got cookie:\n\n'+cookie+'\nPOS | URL | Track | Vol | Muted | Stopped');
			var c = cookie.split(' | ');
			for (var x=0; x<c.length; x++) {
				var newVal = null;
				switch(c[x]) {
					case 'true':
						newVal = true;
					break;
					case 'false':
						newVal = false;
					break;
					case 'null':
						newVal = null;
					break;
					default:
						newVal = c[x];
					break;
				}
				switch(x) {
					case 0:
						this.s_currentPosition = parseInt(newVal);
					break;
					case 1:
						this.currentPlaylistUrl = newVal;
					break;
					case 2:
						this.s_currentTrack = parseInt(newVal);
					break;
					case 3:
						this.s_volume = parseInt(newVal);
					break;
					case 4:
						this.s_isMuted = newVal;
					break;
					case 5:
						this.s_isStopped = newVal;
						this.s_playOnPageLoad = (!newVal);
					break;
				}
			}
		} else {
			this.debug('Got no cookie');
		}
	}

	/************************************* Player Control API ***********************************/
	// Plays track number [s_currentTrack] in [s_playlist]; starting at position: [s_currentPosition]
	this.ctrlPlay = function()	{
		if (this.isPaused) {
			// Unpause
			this.ctrlPause();
		}
		if (this.s_isStopped || !this.ready()) {
			this.o_fProxy.call('playTrack');
		}
		this.s_isStopped = false;
	}
	// Advances track number to [s_currentTrack+1], and begins playing that track.
	this.ctrlNext = function() {
		this.debug('Next', 'ctrl', 6);
		this.ctrlSkipTo(this.s_currentTrack+1);
	}
	// Regresses track number to [s_currentTrack-1], and begins playing that track.
	this.ctrlPrev = function() {
		this.debug('Previous', 'ctrl', 6);
		this.ctrlSkipTo(this.s_currentTrack-1);
	}
	// Sets track number to [trackNo], and begins playing that track.
	this.ctrlSkipTo = function(trackNo) {
		// Skips to a specific track number (ordinal)
		//var dontPlay = this.s_isStopped;
		//if (!this.s_isStopped) this.ctrlStop();
		this.debug('Skipping to #'+trackNo, null, 3);
		var oldTrack = this.s_currentTrack;
		var newTrack = null;
		if (trackNo > this.s_playlist.length-1) {
			if (this.s_repeatPlaylist) {
				newTrack = 0;
			} else {
				newTrack = this.s_playlist.length-1;
			}
		} else if ( trackNo < 0) {
			if (this.s_repeatPlaylist) {
				newTrack = this.s_playlist.length-1;
			} else {
				newTrack = 0;
			}
		} else {
			if (this.s_playlist.length < trackNo) {
				this.error('Cannot skip to track #'+trackNo+', because there are only '+this.s_playlist.length+' tracks in the playlist.');
				return false;
			} else {
				newTrack = trackNo;
			}
		}

		if (oldTrack != newTrack || !this.ready()) {
			// Track changed
			this.s_currentTrack = newTrack;
			if (typeof(this.s_playlist[newTrack]) != 'undefined') {
				this.debug(typeof(this.s_playlist[newTrack]), null, 2);
				var url = this.s_playlist[newTrack].url;
				this.debug('Skipping to: '+newTrack+'\n'+url, 'ctrl', 5);
				this.mediaLoadComplete = false;
				this.o_fProxy.call('loadTrack', url);
				this.updateNode(this.s_n_trackname, this.s_playlist[newTrack].name);
				//this.o_fProxy.call('getVar', 'fl_mediaLength');
				if (this.s_isStopped) {
					//this.ctrlStop();
				} else {
					this.timerReset();
					this.timerStart();
				}
			} else {
				this.error('Trying to play track #'+newTrack+', but the playlist did not define that track.\n\nPlaylist currently contains '+this.s_playlist.length+' entries.');
			}
		} else {
			this.debug('Could not load new track.', null, 3);
		}
	}

	// Plays an arbitrary MP3
	this.ctrlLoadFile = function(url, title) {
		this.mediaLoadComplete = false;
		this.o_fProxy.call('loadTrack', url);
		this.updateNode(this.s_n_trackname, title);
		if (this.s_isStopped) {
			//this.ctrlStop();
		} else {
			this.timerReset();
			this.timerStart();
		}
	}

	// Stops playback
	this.ctrlStop = function() {
		// Clear pause position
		this.o_fProxy.call('stopTrack');
		this.timerStop();
		this.timerReset();
		this.s_isStopped = true;
		this.debug('Stopping', 'ctrl', 6);
	}
	// Saves playback position, stops playback.  If already paused, sets playback position and resumes.
	this.ctrlPause = function() {
		if (this.s_isStopped && this.s_currentPosition) {
			// Is currently paused, so unpause
			this.o_fProxy.call('playTrack', this.s_currentPosition);
			this.timerStart();
			this.s_isStopped = false;
			this.debug('Unpausing', 'ctrl', 6);
		} else {
			// Needs to pause now
			// save cur pos
			this.o_fProxy.call('stopTrack');
			this.timerStop();
			this.s_isStopped = true;
			this.debug('Pausing', 'ctrl', 6);
		}
	}
	/**
	 * Seeks current track to given position
	 */
	this.ctrlSeekTo = function(position) {
		if (this.mediaLoadComplete) {
			//alert('ctrlSeekToValue '+this.ctrlSeekToValue+'\nposition: '+position);
			if (this.ctrlSeekToValue) position = this.ctrlSeekToValue;
			this.ctrlSeekToValue = null;
			if (position) {
				var seconds = position/1000;
				this.debug('Seeking to '+seconds+'\nMS: '+position, null, 3);
				this.o_fProxy.call('playTrack', parseInt(seconds));
			} else {
				this.o_fProxy.call('playTrack');
			}
			this.s_isStopped = false;
			//alert('Setting volume back to '+this.s_volume);
		} else {
			// Cannot seek until media has completed loading
			//this.debug('Waiting for load before seeking...', null, 3);
			if (!this.ctrlSeekToValue) this.ctrlSeekToValue = position;
			setTimeout(this.ctrlSeekTo.bind(this),2500);
		}
	}

	this.timerStart = function() {
		this.trackTimeStarted = new Date();
	}
	this.timerStop = function() {
		this.trackTimeElapsed += this.timerGet();
	}
	this.timerReset = function() {
		this.trackTimeElapsed = 0;
	}
	this.timerGet = function() {
		if (!this.s_isStopped && this.trackTimeStarted) {
			var now = new Date();
			var trackStart = this.trackTimeStarted.valueOf();
			var trackEnd = now.valueOf();
			return (trackEnd - trackStart);
		} else {
			return this.trackTimeElapsed;
		}
	}

	/**
	 * Catches events thrown by the Flash player
	 */
	this.throwEvent = function(eventName) {
		switch (eventName) {
			case 'onBuffering':
				this.setStatus('Buffering');
				while (this.onBuffering.length) {
					this.onBuffering.pop()();
				}
			break;
			case 'onPlay':
				this.setStatus('Playing');
			break;
			case 'onComplete': // Track has completed playing
				this.setStatus('Playback Complete');
				if (this.s_autoAdvanceTrack) this.ctrlNext();
			break;
			case 'onLoad': // Track has completed loading
				this.mediaLoadComplete = true;
				while (this.onTrackLoaded.length) {
					this.onTrackLoaded.pop()();
				}
			break;
			default:
				this.debug(eventName, 'event', 2);
			break;
		}
	}

	this.setStatus = function(status) {
		this.updateNode(this.s_n_status, status);
		window.defaultStatus = status;
	}

	/**
	 * Sets player volume, regulates it to within valid perameters.
	 */
	this.privateSetVol = function(vol) {
		if (vol > 100) vol = 100;
		if (vol < 0) vol = 0;
		//alert('Vol='+vol);
		this.updateNode(this.s_n_volume, vol);
		this.o_fProxy.call('setTrackVolume', vol);
	}
	this.ctrlSetVol = function(vol) {
		if (this.s_showVolume) this.o_volumeSlider.setValue(vol);
		this.s_volume = vol;
		if (parseInt(this.s_volume) == 'NaN') alert('NAN: '+vol);
		this.privateSetVol(vol);
	}

	/**
	 * Toggles mute
	 */
	this.ctrlMute = function() {
		if (this.s_isMuted)      { // Unmute
			this.debug('unMute', 'ctrl', 6);
			this.privateSetVol(this.s_volume);
			this.s_isMuted = false;
		} else {                   // Mute
			this.debug('Mute', 'ctrl', 6);
			this.privateSetVol(0);
			this.s_isMuted = true;
		}
	}
	// Loads a playlist (XML)
	this.ctrlLoadPlaylist = function(url, callBack) {
		this.ctrlLoadPlaylist_onload = createCallback(callBack);
		this.debug('AJAX out to '+url, null, 6);
		this.patience(true);
		this.ajaxOut(url, this.ajaxInPlaylist.bind(this));
		this.currentPlaylistUrl = url;
	}

	this.cb_time = function() {
		this.s_cb_time(this.timerGet());
	}

	/**
	 * Recieves variables from Flash
	 */
	this.setVar = function(varName, value) {
		this.debug('Flash has set "'+varName+'" to "'+value+'"', null, 1);
		this['s_'+varName] = value;
	}

	this.queryFlash = function() {
		//this.debug('Requesting all 3 variables from Flash');
		this.o_fProxy.call('getVar', 'fl_position');
		this.o_fProxy.call('getVar', 'fl_remaining');
		//this.o_fProxy.call('getVar', 'fl_mediaLength');
	}



	// Receives incoming AJAX calls which are bringing a playlist
	this.ajaxInPlaylist = function() {
		if (this.ajaxReady()) {
			this.debug('AJAX playlist recieved, '+this.o_ajax.responseText.length+' bytes long.', null, 6);
			this.debug('Playlist XML is as follows:\n'+this.o_ajax.responseText, null, 7);
			var playlist = this.o_ajax.responseXML.getElementsByTagName('playlist')[0];
			if (!playlist) this.error('XML playlist parsing failed!');
			var tracks = playlist.getElementsByTagName('track');
			if (tracks.length > 0) {
				for (var i=0; i<tracks.length; i++) {
					//var name = tracks[i].getElementsByTagName('name')[0].childNodes[0].nodeValue;
					//var url = tracks[i].getElementsByTagName('url')[0].childNodes[0].nodeValue;
					var name = getText(tracks[i].getElementsByTagName('name')[0]);
					var url = getText(tracks[i].getElementsByTagName('url')[0]);
					this.debug(name+' => '+url, null, 6);
					this.s_playlist.push({
						name: name,
						url: url
					});
				}
				this.ctrlLoadPlaylist_onload();
				this.ctrlLoadPlaylist_onload = createCallback(null);
			} else {
				if (playlist.tagName != 'playlist') {
					this.error('WARNING: The playlist had no parseable <playlist> root element.');
				}
				this.error('WARNING: The playlist yielded zero tracks!');
			}
			this.debug(this.s_playlist.length+' tracks loaded', null, 6);
			this.patience(false);
		}
	}

	/**
	 * If the given param "which" is a node, its innerHTML
	 * is set to param "value"
	 */
	this.updateNode = function(which, value) {
		if (which) which.innerHTML = value;
	}

	/**
	 * Returns true if the current browser has the Flash version
	 * needed by the Media Player.
	 */
	this.flashEnabled = function() {
		return true;
	}

	/**
	 * Dumps the Flash object into the DOM at the specified
	 * entry point (this.s_n_flash)
	 */
	this.writeFlash = function() {
		var flashVars = '';
		flashVars += 'lcId='+this.s_flash_lcId;                       // uid
		flashVars += '&trackVolume='+this.s_volume;                   // 0-100
		flashVars += '&progressColor='+this.s_progressColor;          // 0xffffff
		//flashVars += '&jsObjectName='+this.s_jsInstanceName;
		this.debug('Flash variables at instantiation: '+flashVars);

		var tag = new FlashTag(this.s_playerUrlSWF, this.s_stageHeight, this.s_stageWidth);
		tag.setFlashvars(flashVars);
		this.updateNode(this.s_n_flash, tag.toString());
	}

	/**
	 * Writes an error to the log
	 * @param text     STRING   information about the error
	 * @param category STRING   subsystem which this error pertains to
	 * @param volume   INT      priority of the error, 1=urgent/5=minor
	 */
	this.error = function(text, category, volume) {
		if (!category) category = 'general';
		if (!volume)   volume   = 4;
		now = new Date();
		this.errors.push({
			time: now.valueOf(),
			text: text,
			volume: volume
		});
		if (volume <= this.s_showErrorLevel) {
			this.monolog(text);
		}
		if (volume <= this.s_fatalErrorLevel) alert(text);
	}
	this.debug = function(text, category, volume) {
		if (!category) category = 'debug';
		if (!volume)   volume   = 1;
		this.error(text, 'debug', volume)
	}
	this.errorReport = function() {
		var log = '';
		for (var i=0; i<this.errors.length; i++) {
			log += this.errors[i].text+'\n';
		}
		this.monolog(log);
	}

	this.monolog = function(text) {
		alert('MediaPlayer.js Says:\n----------------------------\n'+text);
	}
	this.dialog = function(text) {
		return confirm('MediaPlayer.js Asks:\n----------------------------\n'+text);
	}

	/**
	 * Tells the user to be patient while AJAX does its stuff
	 */
	this.patience = function(on) {
		return true;
	}

	/**
	 * Imports user settings, then
	 * Checks all settings, returns true if we're GO
	 */
	this.importSettings = function() {
		var retVal = true;
		var now = new Date();
		this.s_flash_lcId = now.valueOf();

		for (varname in settings) {                             // Loop through each incoming setting...
			this['s_'+varname] = settings[varname];               // ...and overwrite the defaults
		}

		this.currentFlashVer = com.deconcept.FlashObjectUtil.getPlayerVersion();
		if (this.s_requiredFlashVer > this.currentFlashVer['major']) {
			this.error('Flash version '+this.s_requiredFlashVer+' required, '+this.currentFlashVer['major']+' found.');
			retVal = false;
		} else {
			this.o_fProxy = new FlashProxy(this.s_flash_lcId, this.s_fProxyUrlSWF);
			if (!this.o_fProxy) {
				this.error('Could not initialize a new FlashProxy.');
				retVal = false;
			}
		}
		if (!this.s_n_flash || !this.s_n_flash.nodeType) {
			this.error('Stage Container (insertStageInto) is not a valid DOM Node.', null, 1);
			retVal = false;
		}
		if (!this.flashEnabled()) {
			this.error('It has been determined that the browser lacks an appropriate version of flash.');
			retVal = false;
		}
		if (false) {
			this.error('Generic error.  No helpful text here!');
			retVal = false;
		}
		return retVal;
	}

	this.ajaxOut = function(url, callBack) {
		this.o_ajax = false;

		if (window.XMLHttpRequest) { // Mozilla, Safari,...
			this.o_ajax = new XMLHttpRequest();
			if (this.o_ajax.overrideMimeType) {
				this.o_ajax.overrideMimeType('text/xml');
			}
		} else if (window.ActiveXObject) { // IE
			try {
				this.o_ajax = new ActiveXObject("Msxml2.XMLHTTP");
			} catch (e) {
				try {
					this.o_ajax = new ActiveXObject("Microsoft.XMLHTTP");
				} catch (e) {
					noop;
				}
			}
		}
		if (!this.o_ajax) {
			this.error('ajaxOut(): Giving up AJAX, cannot create an XMLHTTP instance');
			return false;
		}
		this.o_ajax.onreadystatechange = callBack;
		this.o_ajax.open('GET', url, true);
		this.o_ajax.send(null);
	}
	this.ajaxReady = function() {
		if (this.o_ajax.readyState == 4) {
			if (this.o_ajax.status == 200) {
				return true;
			} else {
				this.error('ajaxIn(): HTTP error code '+this.o_ajax.status);
				return false;
			}
		}
	}

	this.ready = function() {
		return this.playerReady;
	}

	this.construct(settings);
}


function createCallback(callBack) {
	if (typeof(callBack) == 'function') {
		return callBack;
	} else {
		return function() { };
	}
}

/**
 * Because Flash has trouble calling object methods,
 * this helper function was born.
 */
function setVar(vName, vVal) {
	mp.setVar(vName, vVal);
}
function throwEvent(eventName) {
	mp.throwEvent(eventName);
}

function getText(node) {
	// Assumes that you've provided a node which contains a child text node.
	// Returns that text node, NOT empty space or CRs
	if (node) {
		for (var x=0; x<node.childNodes.length; x++) {
			var text = node.childNodes[x].nodeValue.trim();
			if (text != '') return text;
		}
	}
	return false;
}

String.prototype.trim = function() {
	sInString = this.replace( /^\s+/g, "" );// strip leading
	return sInString.replace( /\s+$/g, "" );// strip trailing
}