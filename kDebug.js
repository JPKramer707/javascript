/**
 * Kramer's debugging library
 * 060515
 */
var kDebug = {
	profileData: {},

	makeObject: function(obj) {
		var txt = '';
		for (var key in obj) {
			switch(typeof(obj[key])) {
				case 'function':
				break;
			}
			if (typeof(obj[key]) == 'object') {
				txt += key+' = {\n';
				//txt += Debug.makeObject(obj[key]);
				txt += '}\n';
			} else {
				txt += key+' = '+obj[key]+'\n';
			}
		}
		return txt;
	},

	pStart: function(name) {
		if (typeof(this.profileData[name]) == 'undefined') {
			this.profileData[name] = {
				start: null,
				end: null,
				callCount: 0,
				high: null,
				low: null,
				cumulative: 0
			}
		}
		this.profileData[name].start = new Date();
		this.profileData[name].end = null;
	},

	pEnd: function(name, alert) {
		var pd = this.profileData[name];
		if (typeof(pd) != 'undefined') {
			pd.end = new Date();
			var diff = pd.end.getTime() - pd.start.getTime();
			if (pd.high == null || diff > pd.high) pd.high = diff;
			if (pd.low == null || diff < pd.low) pd.low = diff;
			pd.cumulative += diff;
			pd.callCount++;
		} else {
			window.alert('Cannot end profiling segment "'+name+'", it was never started.');
		}
	},

	pReport: function(name) {
		if (name) {
		} else {
			var log = '';
			var pd = this.profileData;
			for (var name in pd) {
				log += name+':\n';
				log += '::Total Time: '+(pd[name].cumulative)+'ms\n';
				log += '::Call Count: '+pd[name].callCount+'\n';
				log += '::Avg Time: '+((pd[name].cumulative/pd[name].callCount))+'ms\n';
				log += '::Low Time: '+pd[name].low+'ms\n';
				log += '::High Time: '+pd[name].high+'ms\n\n';
			}
		}
		alert('Profile Report:\n--------------------------------\n'+log);
	}
}