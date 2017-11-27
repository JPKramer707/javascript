/*
 * This script written by Joshua Paine 2005 <http://fairsky.us/contact>
 * Links are appreciated. Telling me when you use this is really appreciated.
 * Nothing is required: I hereby place the code contained in this file in
 * the public domain and disclaim any and all proprietary rights to it.
 *
 * Documentation at http://demo.fairsky.us/javascript/png.html
 * Last Update: 2005-08-20
 */


// Must change this to the location of a transparent GIF on your server.
// You know you have one. (Be sure to make the path such that it will work
// from any folder on your server where you plan on using this. E.g., use
// a path beginning with a '/' or with 'http://'.)
var PNGuin_Transparent_GIF = '/i/clear.gif';


var pngua =  navigator.userAgent.toUpperCase();
if(window.attachEvent && pngua.indexOf('OPERA')==-1 && (pngua.indexOf('MSIE 6') || pngua.indexOf('MSIE 5.5'))){ window.attachEvent("onload", PNGuin); }

function PNGuin()
{
	var el, img, imgs, x, w, h, src, sm;
	for(x=0; x<document.all.length; x++)
	{ // Do background PNGs
		el = document.all[x];
		if(el.className.indexOf('PNGuin')!=-1)
		{
			src = el.currentStyle.backgroundImage;
			src = src.substring(5,src.length-2);
			if(!el.currentStyle.hasLayout)
			{
				if(document.copmpatMode && document.compatMode != 'BackCompat') el.style.height = (el.scrollHeight-parseInt(el.currentStyle.paddingTop)-parseInt(el.currentStyle.paddingBottom))+'px';
				else el.style.height = el.scrollHeight + 'px';
			}
			el.style.backgroundImage='none';
			sm = (el.className.indexOf('PNGuin:Scale')!=-1) ? 'scale' : 'crop';
			el.style.filter = "progid:DXImageTransform.Microsoft.AlphaImageLoader(src='"+src+"',sizingMethod='"+sm+"')";
		}
	}
	imgs  = document.getElementsByTagName('img');
	for(x=0; x<imgs.length; x++)
	{ // Do IMG PNGs
		img = imgs[x];
		src = img.src;
		if((/\.png$/i).test(src) || (/\.png\?/i).test(src))
		{
			img.width = img.width; img.height = img.height; // Doesn't seem right, does it?
			img.src = PNGuin_Transparent_GIF;
			img.style.filter = "progid:DXImageTransform.Microsoft.AlphaImageLoader(src='"+src+"',sizingMethod='scale')";
		}
	}
}