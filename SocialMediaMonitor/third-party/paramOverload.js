/*
 jquery-param (c) 2015 KNOWLEDGECODE | MIT
*/
(function(h){var c=function(c){var f=[],g=function(d,a){a="function"===typeof a?a():a;a=null===a?"":void 0===a?"":a;f[f.length]=encodeURIComponent(d)+"="+encodeURIComponent(a)},e=function(d,a){var c;if(d)if(Array.isArray(a)){var b=0;for(c=a.length;b<c;b++)e(d+"["+("object"===typeof a[b]&&a[b]?b:"")+"]",a[b])}else if("[object Object]"===String(a))for(b in a)e(d+"["+b+"]",a[b]);else g(d,a);else if(Array.isArray(a))for(b=0,c=a.length;b<c;b++)g(a[b].name,a[b].value);else for(b in a)e(b,a[b]);return f};
return e("",c).join("&")};"object"===typeof module&&"object"===typeof module.exports?module.exports=c:"function"===typeof define&&define.amd?define([],function(){return c}):h.param=c})(this);