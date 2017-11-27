var kChat = Class.create();
kChat.prototype = {
	initialize: function(s) {
		this.settings = s;
		this.interval = null;                                            // Interval object controlling AJAX requests
		this.lastMovementTime = null;
		this.lastStatementID = null;
		this.consecutiveAJAXErrors = 0;
		this.stateButtons = [                                            // State buttons located in the Lobby and in the Chat
			{node: null, state: ''},
			{node: null, state: ''}
		];
		this.state = null;                                               // Current state of the chat
		this.alternateHTML = null;                                       // HTML to insert into the Lobby
		this.newState = null;                                            // State which this administrator wants to change to
		this.ajax = null;                                                // AJAX request object
		this.users = [];                                                 // User list
		this.me = null;                                                  // Current user's profile (pointer to this.users[x])
		this.statements = [];                                            // All statements in this chat
		this.statementsQueue = [];                                       // Statements this user has made, waiting to go out on the next AJAX request
		this.events = [];                                                // DOM events created by this object
		this.form = null;                                                // Form which contains this.s.n_input
		this.xmlDump = false;
		this.s = {
			n_statements: null,                                            // <dl> chat window
			n_users: null,                                                 // <ul> user list
			n_input: null,                                                 // Text input for user to speak in
			n_lobby: null,                                                 // Container to be shown in lieu of the chat window during pre, ready, and post states.
			n_chat: null,                                                  // Container of the chat pane
			c_onStateChange: null,                                         // Callback executed on state change, given new state as argument
			c_userListName: null,                                          // Callback which formats HTML which should be used to represent users in the user list
			c_chatName: null,                                              // Callback to format names in the chat box. Argument is the user's data profile
			ajaxUrl: '',                                                   // URL to retrieve AJAX XML from
			debug: false,                                                  // Display debug messages?
			sysMsgs: false,                                                // Display system messages? (users arriving/departing)
			showAndHide: true,                                             // Shall we show/hide lobby/chat elements on state change?
			AJAXErrorLimit: 4,                                             // Number of consecutive server errors that must occur before AJAX polling is aborted
			errors: true,                                                  // Display critical errors? (recommended that you keep this true)
			cmdPrefix: '/',                                                // Prefix character for console commands
			chatID: 1,                                                     // ID of the chat managed by this object
			scrollTo: 'bottom',                                            // Messages float to top or sink to bottom of the statements <dl>?
			interval: 1000                                                 // How frequently to poll for new data via AJAX
		};
		for (var key in s) this.s[key] = s[key];
		this.form = DOM.getAncestorsByTagName(this.s.n_input, 'form')[0];
		if (typeof(s['ajaxUrl']) == 'undefined') {                       // Autodetect the AJAX URL from the form action
			this.s.ajaxUrl = this.form.getAttribute('action');
		}

		// Argument checking
		if (typeof(this.s.ajaxUrl) != 'string') this.error('AJAX URL must be a string.');
		for (var key in this.s) {
			if (key.substr(0,2) == 'n_') {
				if (!DOM.isNode(this.s[key])) {
					this.error(key+' must be a DOM node object!');
				}
			} else if (key.substr(0,2) == 'c_') {
				if (typeof(this.s[key]) != 'function' && this.s[key] != null) {
					this.error(key+' must be a callback function!');
				}
			}
		}
		if (parseInt(this.s.interval) < 1) this.error('Interval must be a nonzero integer!');
		if (parseInt(this.s.chatID) < 1) this.error('chatID must be a nonzero integer!');

		// Load in pre-populated users and statements
		var tags = this.s.n_statements.getElementsByTagName('dt');
		var texts = this.s.n_statements.getElementsByTagName('dd');
		var users = this.s.n_users.getElementsByTagName('li');
		for (var x=0; x<users.length; x++) {
			var user = {
				id: DOM.getCommentData('kChat:uid', users[x]),
				name: DOM.getCommentData('kChat:membername', users[x]),
				privilege: DOM.getCommentData('kChat:privilege', users[x]),
				arriveTime: DOM.getCommentData('kChat:arriveTime', users[x]),
				me: bool(DOM.getCommentData('kChat:me', users[x])),
				node: users[x]
			};
			if (user.arriveTime > this.lastMovementTime) this.lastMovementTime = user.arriveTime;
			user.arriveTime = unixToDate(user.arriveTime);
			this.addUser(user, false);
		}
		this.me = this.getUser({me: true}).data;
		if (!this.me) this.debug('Identity Crisis:\nCould not locate a user registered as "me".');
		if (this.me) Element.addClassName(this.me.node, 'me');

		for (var x=0; x<tags.length; x++) {
			var statement = {
				id: DOM.getCommentData('kChat:id', tags[x]),
				uid: DOM.getCommentData('kChat:uid', tags[x]),
				text: DOM.getElementText(texts[x]),
				time: unixToDate(DOM.getCommentData('kChat:time', tags[x])),
				nodes: {
					tag: tags[x],
					text: texts[x]
				}
			};
			this.lastStatementID = statement.id;
			if (this.me) {
				if (statement.uid == this.me.id) {
					Element.addClassName(statement.nodes.tag, 'me');
					Element.addClassName(statement.nodes.text, 'me');
				}
			}
			this.statements.push(statement);
		}

		// Inject special users
		this.addUser({
			id: -1,
			name: 'Debugger',
			privilege: 'bot',
			arriveTime: new Date(),
			node: null
		}, false)
		this.addUser({
			id: -2,
			name: 'System',
			privilege: 'bot',
			arriveTime: new Date(),
			node: null
		}, false)
		this.debug('Debugging is ON.');
		this.sysMsg('System messages are ON.');

		this.events.push(Event.observe(this.s.n_input, 'keypress', function(e) {
			if (Event.keyCode(e) == 13) this.submit(e);
		}.bind(this)));
		this.events.push(Event.observe(this.form, 'submit', this.submit.bind(this)));

		this.stateButtons[0].node = DOM.findFlag('kChat:stateButton', this.s.n_lobby);
		this.stateButtons[1].node = DOM.findFlag('kChat:stateButton', this.s.n_chat);

		if (this.me) this.debug('Your name is '+this.me.name);

		this.processCmd('unfreeze', false); // Start up AJAX
		this.scroll();

		// Get current state
		this.state = null;
		this.changeState(DOM.getCommentData('kChat:state', this.s.n_chat));
	},

	error: function(text, fatal) {
		if (this.s.errors) {
			alert('kChat Error'+((fatal) ? ' (fatal)' : '')+':\n--------------------------------\n'+text);
		}
	},

	submit: function(e) {
		Event.stop(e);
		this.speak(this.s.n_input.value);
		this.s.n_input.value = '';
	},

	speak: function(text) {
		if (text.trim().length == 0) return false;
		if (text.substr(0,1) == this.s.cmdPrefix) { // Command mode
			var command = (this.processCmd(text.substr(1)));
		}
		if (!command) {
			this.statementsQueue.push(text);
			this.refresh();
		}
	},

	refresh: function() {
		if (this.ajax != null) {
			this.debug('Concurrent AJAX request prevented');
			return false;                             // Prevent multiple concurrent AJAX requests
		}
		if (this.s.debug) {
			var now = new Date();
			window.defaultStatus = 'Last refresh attempted at: '+now.getHours()+':'+now.getMinutes()+':'+now.getSeconds();
		}
		var pars = [];
		var els = this.form.elements;
		for (var x=0; x<els.length; x++) {
			if (els[x].getAttribute('type') == 'hidden') {
				pars.push(els[x].getAttribute('name')+'='+els[x].getAttribute('value'));
			}
		}
		if (this.statementsQueue.length) pars.push('statement='+encodeURIComponent(this.statementsQueue.pop()));
		if (this.lastStatementID) pars.push('lastStatementID='+this.lastStatementID);
		if (this.lastMovementTime) pars.push('lastMovementTime='+this.lastMovementTime);
		if (this.newState) pars.push('newState='+this.newState);
		pars.push('chatID='+this.s.chatID);
		this.debug('AJAX out: '+this.s.ajaxUrl+'?'+pars.join('&'));
		this.ajax = new Ajax.Request(this.s.ajaxUrl, {
			method: 'get',
			parameters: pars.join('&'),
			onFailure: function(req) {
				this.consecutiveAJAXErrors++;
				this.sysMsg('HTTP Error '+req.status+': '+req.statusText+'\n\nCould not complete AJAX request.', true);
				if (this.consecutiveAJAXErrors > this.s.AJAXErrorLimit) {
					this.sysMsg('AJAX error limit exceeded - AJAX activity has been stopped.', true);
					this.processCmd('freeze', false);
				}
				this.ajax = null;
			}.bind(this),
			onSuccess: function(req) {
				this.consecutiveAJAXErrors = 0;
				var xml = req.responseXML;
				if (this.xmlDump) {
					this.xmlDump = false;
					this.debug('XML: '+req.responseText.htmlEntities(), true);
				}
				if (xml) {
					this.debug('AJAX in: '+req.responseText.length+' bytes');
					var state = xml.getElementsByTagName('state')[0];
					var statements = xml.getElementsByTagName('statement');
					var arrivals = xml.getElementsByTagName('userArrival');
					var departures = xml.getElementsByTagName('userDeparture');

					if (DOM.isNode(state)) {
						var newState = state.getAttribute('code');
						if (this.state != newState) {
							this.alternateHTML = DOM.getElementText(state);
							this.changeState(newState);
						}
					}

					for (var x=0; x<statements.length; x++) {
						this.addStatement({
							id: statements[x].getAttribute('id'),
							uid: statements[x].getAttribute('userid'),
							text: DOM.getElementText(statements[x]),
							time: unixToDate(statements[x].getAttribute('time'))
						});
					}
					for (var x=0; x<arrivals.length; x++) {
						var time = arrivals[x].getAttribute('time');
						if (time > this.lastMovementTime) this.lastMovementTime = time;
						this.addUser({
							id: arrivals[x].getAttribute('id'),
							name: arrivals[x].getAttribute('name'),
							privilege: arrivals[x].getAttribute('privilege'),
							arriveTime: unixToDate(time)
						});
					}
					for (var x=0; x<departures.length; x++) {
						var time = departures[x].getAttribute('time');
						if (time > this.lastMovementTime) this.lastMovementTime = time;
						this.delUser(departures[x].getAttribute('id'));
					}
				} else {
					this.debug('kChat Error - could not parse XML.\n'+req.responseText);
				}
				this.ajax = null;
			}.bind(this)
		});
	},

	changeState: function(newState) {
		if (this.alternateHTML) {
			this.s.n_lobby.innerHTML = this.alternateHTML;
			this.stateButtons[0].node = DOM.findFlag('kChat:stateButton', this.s.n_lobby);
		}
		this.state = newState;
		if (this.state == this.newState) this.newState = null;
		this.debug('Chat state changed to: '+newState);

		if (typeof(this.s.c_onStateChange) == 'function') this.s.c_onStateChange(this, newState);
		// Button
		var buttonState = null;
		var buttonText = '';
		switch(newState) {
			case 'pre':
				buttonState = 'chat';
				buttonText = 'Begin Chat';
			break;
			case 'ready':
				buttonState = 'chat';
				buttonText = 'Begin Chat';
			break;
			case 'chat':
				// Hide lobby, show chat
				// New "end chat" button
				buttonState = 'post';
				buttonText = 'End Chat';
			break;
			case 'post':
				// Hide chat, show lobby
				// Remove button
			break;
		}
		if (this.me) {
			if (this.me.privilege == 'admin') {
				for (var x=0; x<this.stateButtons.length; x++) {
					if (this.stateButtons[x].node) {
						if (buttonState) {
							var stateButton = document.createElement('input');
							stateButton.setAttribute('type', 'button');
							stateButton.setAttribute('value', buttonText);
							var event = Event.observe(stateButton, 'click', this.stateButtonClick.bind(this, buttonState));
						} else {
							var stateButton = document.createComment('Placeholder');
						}
						DOM.replace(this.stateButtons[x].node, stateButton);
						this.stateButtons[x] = {
							node: stateButton,
							event: event,
							state: buttonState,
							text: buttonText
						};
					}
				}
			}
		}
	},

	stateButtonClick: function(newState) {
		this.processCmd('changestate '+newState);
	},

	sysMsg: function(text, force) {
		if ((this.s.sysMsgs && force !== false) || force === true) {
			this.addStatement({
				id: 0,
				uid: -2,
				text: text,
				time: new Date()
			});
		}
	},

	debug: function(text, force) {
		if ((this.s.debug && force !== false) || force === true) {
			this.addStatement({
				id: 0,
				uid: -1,
				text: text,
				time: new Date()
			});
		}
	},

	addUser: function(userdata, createHTML) {
		/*
		{
			id: 0,
			name: 'Bob',
			privilege: 'admin',
			arriveTime: Date
		}
		*/
		if (typeof(createHTML) == 'undefined') createHTML = true;
		if (!this.getUser({id: userdata.id})) {
			if (createHTML) {
				userdata.node = document.createElement('li');
				Element.addClassName(userdata.node, 'priv_'+userdata.privilege);
				if (this.s.c_userListName) {
					userdata.node.innerHTML = this.s.c_userListName(userdata);
				} else {
					userdata.node.innerHTML = userdata.name;
				}
			}
			if (this.s.c_chatName) {
				userdata.chatName = this.s.c_chatName(userdata);
			} else {
				userdata.chatName = userdata.name;
			}
			if (createHTML) this.s.n_users.appendChild(userdata.node);
			this.users.push(userdata);
			this.sysMsg(userdata.name+' has entered the chat.');
			return true;
		} else {
			return false;
		}
	},

	delUser: function(uid) {
		var user = this.getUser({id: uid});
		if (user) {
			this.users.splice(user.index, 1);
			DOM.remove(user.data.node);
			this.sysMsg(user.data.name+' has left the chat.');
			return true;
		}
		return false;
	},

	getUser: function(userdata) {
		for (var x=0; x<this.users.length; x++) {
			var match = true;
			for (var key in userdata) if (this.users[x][key] != userdata[key]) match = false;
			if (match) {
				return {
					data: this.users[x],
					index: x
				};
				break;
			}
		}
		return false;
	},

	/**
	 * Processes commands in text format
	 * @return bool true if the command was valid, false if not.
	 */
	processCmd: function(text, verbose) {
		var command = true;
		if (typeof(verbose) == 'undefined') var verbose = true;
		var pieces = text.split(' ');
		switch(pieces[0]) {
			case 'clear':
				this.s.n_statements.innerHTML = '';
			break;
			case 'changestate':
				this.newState = pieces[1];
				this.refresh();
			break;
			case 'xyzzy':
				this.sysMsg('Nothing happens.', verbose);
			break;
			case 'plugh':
				this.speak('A hollow voice says,"Plugh!"');
			break;
			case 'freeze':
				clearInterval(this.interval);
				this.sysMsg('AJAX activity has been frozen', verbose);
			break;
			case 'unfreeze':
				this.interval = setInterval(this.refresh.bind(this), this.s.interval);
				this.sysMsg('AJAX activity has been started.', verbose);
			break;
			case 'debug':
				this.s.debug = (!this.s.debug);
				this.debug('Debug '+((this.s.debug) ? 'on' : 'off'), verbose);
			break;
			case 'system':
				this.s.sysMsgs = (!this.s.sysMsgs);
				this.sysMsg('System messages '+((this.s.sysMsgs) ? 'on' : 'off'), verbose);
			break;
			case 'annoy':
				if (pieces[1] > 0) {
					annoy=0;
					this.sysMsg('Annoying everybody else...', verbose);
					setInterval(function() {
						annoy++;
						this.speak('I\'m annoying you all for debug purposes. ('+annoy+')');
					}.bind(this), pieces[1]);
				} else {
					this.sysMsg('Oh boy, are you sure you want to do this? If so, specify an interval in ms.', verbose);
				}
			break;
			case 'refresh':
				this.sysMsg('Refreshing via AJAX...', verbose);
				this.refresh();
			break;
			case 'interval':
				this.s.interval = pieces[1];
				this.processCmd('freeze', false);
				this.processCmd('unfreeze', false);
				this.sysMsg('New AJAX interval: '+pieces[1]+' ms', verbose);
			break;
			case 'viewxml':
				this.sysMsg('Waiting to dump next AJAX update\'s XML...', verbose);
				this.xmlDump = true;
			break;
			case 'adduser':
				if (!pieces[1]) {
					this.sysMsg('Syntax: /adduser ID NAME PRIVILEGE');
				} else {
					var now = new Date();
					this.addUser({
						id: pieces[1],
						name: pieces[2],
						privilege: pieces[3],
						arriveTime: (now.getTime()*1000)
					});
					this.sysMsg('Added fake user "'+pieces[1]+'".', true);
				}
			break;
			case 'deluser':
				if (!pieces[1]) {
					this.sysMsg('Syntax: /deluser NAME');
				} else {
					var targetId = this.getUser({name: pieces[1]}).id;
					this.delUser(targetId);
					this.sysMsg('Removed fake user "'+pieces[1]+'".', true);
				}
			break;
			case 'scrollto':
				if (pieces[1] == 'top' || pieces[1] == 'bottom') {
					this.s.scrollTo = pieces[1];
					this.processCmd('clear', true);
					this.sysMsg('Scrolling to '+this.s.scrollTo+' now.', verbose);
				} else {
					this.sysMsg('Cannot scroll to "'+pieces[1]+'" - (top|bottom)', verbose);
				}
			break;
			default:
				command = false;
			break;
		}
		return command;
	},

	scroll: function() {
		if (this.s.scrollTo == 'bottom') {
			this.s.n_statements.scrollTop = this.s.n_statements.scrollHeight; // Scroll to bottom
		}
	},

	addStatement: function(data) {
		if (typeof(data) != 'array') {
			data = [data];
		}
		for (var x=0; x<data.length; x++) {
			var user = this.getUser({id: data[x].uid});
			if (user) {
				if (data[x].id != 0) this.lastStatementID = data[x].id;
				if (data[x].text.trim().length == 0) continue;
				data[x].nodes = {
					tag: document.createElement('dt'),
					text: document.createElement('dd')
				};
				data[x].nodes.tag.innerHTML = user.data.chatName+':';
				data[x].nodes.text.innerHTML = data[x].text;
				Element.addClassName(data[x].nodes.tag, 'priv_'+user.data.privilege);
				Element.addClassName(data[x].nodes.text, 'priv_'+user.data.privilege);
				if (this.me) {
					if (user.data.me) {
						Element.addClassName(data[x].nodes.tag, 'me');
						Element.addClassName(data[x].nodes.text, 'me');
					}
				}
				data[x].user = user;
				if (this.s.scrollTo == 'top') {
					DOM.insertChild(data[x].nodes.text, this.s.n_statements);
					DOM.insertChild(data[x].nodes.tag, this.s.n_statements);
					this.scroll();
				} else if (this.s.scrollTo == 'bottom') {
					this.s.n_statements.appendChild(data[x].nodes.tag);
					this.s.n_statements.appendChild(data[x].nodes.text);
					this.scroll();
				}
				this.statements.push(data[x]);
			}
		}
	}
};
