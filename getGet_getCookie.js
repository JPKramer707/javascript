/**
 * Gets a cookie
 **/
function getCookie(name) {
	var cookies = document.cookie.split('; ');
	for (var x=0; x<cookies.length; x++) {
		var cookie = cookies[x].split('=');
		if (cookie[0] == name) return cookie[1];
	}
	return false;
}

/**
 * Gets a GET variable
 **/
function getGet(name) {
	var getvars = document.location.search.substring(1).split('&');
	for (var x=0; x<getvars.length; x++) {
		var getvar = getvars[x].split('=');
		if (getvar[0] == name) return getvar[1];
	}
	return false;
}
