/**
 * Converts a complext Javascript object into a GET string which can be passed
 * to PHP and interpereted as a complext PHP object.
 **/
function obj2Get(obj, context) {
	var vars = [];
	for (var key in obj) {
		switch (typeof(obj[key])) {
			case 'object':
			case 'array':
				// Recurse
				var newContext = (typeof(context) != 'undefined') ? context+'['+key+']' : key;
				var newVars = arguments.callee(obj[key], newContext);
				for (var x=0; x<newVars.length; x++) vars.splice(0,0,newVars[x]);
			break;
			case 'string':
			case 'integer':
			case 'float':
			case 'number':
				// Record data
				if (typeof(context) == 'undefined') var context = key;
				vars.push(context+'['+encodeURIComponent(key)+']='+encodeURIComponent(obj[key]));
			break;
			case 'undefined':
				vars.push(context+'['+encodeURIComponent(key)+']=');
			break;
			case 'function':
				// Can't do anything with this bad boy
			break;
			default:
				alert('Unknown object type: '+typeof(obj[key]));
				debugger;
			break;
		}
	}
	return vars;
}