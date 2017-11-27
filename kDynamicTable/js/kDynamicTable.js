var kDynamicTable = Class.create();
kDynamicTable.prototype = {
	initialize: function(s) {
		this.settings = s;
		this.headers = [];
		this.rows = [];
		this.currentResizing = null;
		this.currentSortBy = null;
		this.currentSortDir = null;
		this.events = [];
		this.n_thead = null;
		this.n_tbody = null;
		this.s = {
			table: null,
			sortable: true,
			resizable: true,
			overlap: 6,
			overlapCorrection: 0,
			firstSortDirection: 'A',
			sortClassA: 'ascending',
			sortClassD: 'descending'
		};
		for (var key in s) this.s[key] = s[key];

		this.n_thead = this.s.table.getElementsByTagName('thead')[0];
		var th = this.n_thead.getElementsByTagName('th');
		for (var x=0; x<th.length; x++) {
			var header = {
				node: th[x],
				name: th[x].innerHTML,
				borderPatrol: false,
				events: []
			};

			if (this.s.resizable && x < th.length-1) {
				var bPatrol = document.createElement('div');
				Element.addClassName(bPatrol, 'border');
				bPatrol.style.position = "absolute";
				bPatrol.style.width = this.s.overlap+"px";
				header.borderPatrol = th[x].appendChild(bPatrol);

				HID.p.observe({
					event: 'nat_mousedown',
					elements: bPatrol,
					callback: this.resizeStart.bind(this, header)
				});
				HID.p.observe({
					event: 'nat_mouseup',
					elements: document.getElementsByTagName('body')[0],
					callback: this.resizeEnd.bind(this, header)
				});
				this.adjustBorder(header);
			}

			if (this.s.sortable) {
				this.events.push(Event.observe(th[x], 'click', this.sortColumn.bind(this, x)));
			}
			this.headers.push(header);
		}
		this.n_tbody = this.s.table.getElementsByTagName('tbody')[0];
		var trs = this.n_tbody.getElementsByTagName('tr');
		for (var x=0; x<trs.length; x++) {
			var tds = trs[x].getElementsByTagName('td');
			var row = {
				node: trs[x],
				data: {}
			};
			for (var y=0; y<tds.length; y++) row.data[this.headers[y].name] = tds[y].innerHTML;
			this.rows.push(row);
		}
	},

	sortColumn: function(which) {
		// Compute a new sort direction, add classes
		if (this.currentSortDir) {
			Element.removeClassName(this.headers[which].node, this.s['sortClass'+this.currentSortDir]);
			this.currentSortDir = (this.currentSortDir == 'A') ? 'D' : 'A';
		}	else if (this.currentSortBy != this.headers[which].node) {
			this.currentSortDir = this.s.firstSortDirection.charAt(0).toUpperCase();
		}
		Element.addClassName(this.headers[which].node, this.s['sortClass'+this.currentSortDir]);

		// Add classes related to the new "sort by" column
		if (this.currentSortBy) Element.removeClassName(this.currentSortBy, 'sort');
		this.currentSortBy = this.headers[which].node;
		Element.addClassName(this.currentSortBy, 'sort');

		// Sort
		var columnName = this.headers[which].name;
		this.rows.sort(function(column,a,b) {
		  if (a.data[column]<b.data[column]) return -1;
		  if (a.data[column]>b.data[column]) return 1;
		  return 0;
		}.bind(this, columnName));
		if (this.currentSortDir == 'A') this.rows.reverse();             // Reverse the sort if sort direction mandates it

		// Re-order DOM rows accordingly
		for (var x=0; x<this.rows.length; x++) {
			this.n_tbody.appendChild(this.rows[x].node);
		}

		/* Valuable colspan code here
		var trs = this.s.table.getElementsByTagName('tbody')[0].getElementsByTagName('tr');
		for (var x=0; x<trs.length; x++) {
			var tds = trs[x].getElementsByTagName('td');
			var rowPos = 0;
			for (var y=0; y<tds.length; y++) {
				if (rowPos == which) {
					//tds[y].innerHTML += ' sort';
				}
				rowPos += 1;
				if (tds[y].getAttribute('colspan')) rowPos += tds[y].getAttribute('colspan')-1;
			}
		}
		*/
		for (var x=0; x<this.headers.length; x++) this.adjustBorder(this.headers[x]); // Adjust all borders
	},

	adjustBorder: function(header) {
		if (this.s.resizable && header.borderPatrol) {
			var pos = Position.cumulativeOffset(header.node);
			var dim = Element.getDimensions(header.node);
			var posx = pos[0]+dim.width-((this.s.overlap+this.s.overlapCorrection)/2);
			var posy = pos[1];
			header.borderPatrol.style.top = posy+'px';
			header.borderPatrol.style.left = posx+'px';
			header.borderPatrol.style.height = dim.height+"px";
		}
	},

	resizeStart: function(which) {
		this.currentResizing = HID.p.observe({
			event: 'nat_mousemove',
			elements: document.getElementsByTagName('body')[0],
			callback: function(header) {
				this.adjustBorder(header);
				var curX = Position.cumulativeOffset(header.node)[0];
				var mouseX = HID.p.getPos().x;
				var newWidth = mouseX - curX;
				header.node.style.width = (newWidth-15)+'px';
			}.bind(this, which)
		});
	},

	resizeEnd: function(which) {
		if (this.currentResizing) {
			HID.p.unObserve(this.currentResizing);
			for (var x=0; x<this.headers.length; x++) this.adjustBorder(this.headers[x]);
		}
	}
};