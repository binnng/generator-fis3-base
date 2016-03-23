var utils = module.exports = {};
var ajax = require("./ajax");
var deparams = ajax.deparams;

utils.watch = function( check, handle ) {
  var ret = function() {
    var check_res = check();
    if( check_res ){
      handle(check_res);
    } else {
      setTimeout(ret, 100);
    }
  }
  ret();
};

utils.getQueryData = function() {
	return (deparams(location.search) || {});
};

utils.patchQuery = function( url ) {
  var tail = ajax.params(deparams(location.search));
  return url + (url.indexOf('?') == -1 ? '?' : '&' )+ tail;
};

utils.replaceUrlPrefix = function( origin, target ) {
  var reg_domain = /^https?\:\/\/([^\/]+)/;
  if( origin.match( reg_domain ) ){
    return origin.replace(reg_domain, target);
  } else {
    return target + origin;
  }
};

utils.fixLen = function( str, len, lead ) {

  str = str + '';

  if( str.length < len ){
    str = Array( (len - str.length)+ 1 ).join(lead) + str;
  }

  return str;
};
