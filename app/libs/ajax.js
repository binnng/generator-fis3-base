var ajax = (function(settings) {
  var default_headers = {
    'X-Requested-With': 'XMLHttpRequest',
    'Accept': 'text/javascript, text/html, application/xml, text/xml, */*'
  };

  var transports = [
    function() {
      return new XMLHttpRequest();
    },
    function() {
      return new ActiveXObject('Msxml2.XMLHTTP');
    },
    function() {
      return new ActiveXObject('Microsoft.XMLHTTP');
    }
  ];

  var get_transport = function() {
    var transport, i, length;
    for (i = 0, length = transports.length; i < length; i++) {
      try {
        transport = transports[i]();
        get_transport = (function(k){
          return function() {
            console.log( 'new get_transport');
            return transports[k]();
          }
        })(i);
        return transport;
        break;
      } catch (e) {}
    }
  }

  function params( data ) {
    // simple
    var ret = [];
    for(var name in data){
      if(data.hasOwnProperty(name)){
        ret.push(encodeURIComponent('' + name) + '=' + encodeURIComponent( '' + data[name]));
      }
    }
    return ret.join('&');
  }

  function deparams( str ) {
    var index_hash = str.indexOf('#');
    var index_qmark =str.indexOf('?');

    index_hash = index_hash == -1 ? Infinity : index_hash;
    index_qmark = index_qmark == -1 ? -1 : index_qmark;

    str = str.slice(index_qmark + 1,  index_hash);
    str = (str || '').trim();

    if(!str.length ){
      return {};
    }
    str = str.split('&');

    var ret = {};
    var pair
    for(var i = 0, len = str.length;i< len;i++){
      pair = str[i].split('=');
      try{ pair[0] = decodeURIComponent(pair[0]); } catch(e){}
      try{ pair[1] = decodeURIComponent(pair[1]); } catch(e){}
      ret[pair[0]] = pair[1];
    }
    return ret;
  }

  var get_browser_resolution = function() {
      var myWidth = 0, myHeight = 0;
      try{
          if( typeof( window.innerWidth ) == 'number' ) {
            //Non-IE
            myWidth = window.innerWidth;
            myHeight = window.innerHeight;
          } else if( document.documentElement 
            && ( document.documentElement.clientWidth || document.documentElement.clientHeight ) ) {
            //IE 6+ in 'standards compliant mode'
            myWidth = document.documentElement.clientWidth;
            myHeight = document.documentElement.clientHeight;
          } else if( document.body && ( document.body.clientWidth || document.body.clientHeight ) ) {
            //IE 4 compatible
            myWidth = document.body.clientWidth;
            myHeight = document.body.clientHeight;
          }
      } catch(e){}

      var ret = {};

      ret['screen' + '_height'] = myHeight;
      ret['screen' + '_width'] = myWidth;

      return btoa(JSON.stringify(ret));
  };

  function request ( settings, callback, failed) {
    var method = (settings.method || 'get').toLowerCase();
    var transport = get_transport();
    var abortTimeout;
    
    transport.onreadystatechange = function() {
      if (transport.readyState !== 4) {
        return;
      }
      var data;
      // 增加超时
      if (abortTimeout) {
        clearTimeout(abortTimeout);
      }
      try{
        data = JSON.parse(transport.responseText);
      } catch(e){
        data = transport.responseText;
      }

      callback(data);
    };

    // ajax("/is/new", function() {...})
    if (typeof settings == "string") {
      settings = {
        url: settings,
        timeout: 0
      };
    }

    var data_str = 'wcp=' + encodeURIComponent( get_browser_resolution() );
    if(settings.data){
      data_str = params(settings.data) + '&' + data_str;
    }

    var url = settings.url;
    if( !url ){
      throw new Error('url must be provided');
    }

    if( method == 'get' ){
      url = data_str ? url + '?' + data_str : url;
    }

    transport.open(method, url, true);

    var name;
    for(name in default_headers) {
      transport.setRequestHeader(name, default_headers[name]);
    }

    if(settings.headers){
      for(name in settings.headers) {
        transport.setRequestHeader(name, settings.headers[name]);
      }
    }

    // 增加超时
    if (settings.timeout > 0) {
      abortTimeout = setTimeout(function(){
        transport.onreadystatechange = function () {};
        transport.abort();
        if (typeof failed === 'function') {
          failed(transport, settings);
        }
      }, settings.timeout);
    }

    if( data_str && method == 'post' ){
      transport.send(data_str);
    } else {
      transport.send();
    }
  }

  request.get = function( settings, callback, failed) {
    settings.method = 'get';
    request(settings, callback, failed);
  };
  request.post = function( settings, callback, failed) {
    settings.method = 'post';
    request(settings, callback, failed);
  };

  request.polling = function( settings, check, failed ) {
    var start = new Date().getTime();
    if( !settings || !settings.timeout || !settings.request ){
      throw new Error('illegal params');
    }
    function do_request () {
      request( settings.request, function( data ) {
        var ret = check( data );
        var now = new Date.getTime();
        var delta = now - start;

        if( delta > setting.timeout ){
          failed();
        } else if( !ret ){
          do_request();
        }
      });
    }
  };
  request.parallel = function( requests, finish ) {
    var len = requests.length;
    var res = []
    var done =  function( n ) {
      return function( d ) {
        len --;
        res[n] = d;
        if( len === 0 ){
          finish.apply(null, res);
        }
      };
    };

    requests.forEach(function( req, idx ) {
      request( req, done(idx) );
    });
  };

  request.get_with_local_cache = function( cache_key, settings, get_data, handle ) {
    var url = settings.url;

    cache_key = cache_key ? ( cache_key + '::' + url ): null;

    var check_data = function ( ajax_data ) {
      var data_to_cache = get_data(ajax_data);
      if( !cache_key ){
        handle(data_to_cache);
      }else if( data_to_cache ){
        var cached_content = Store(cache_key);
        var str_to_cache = JSON.stringify(data_to_cache);
        if( str_to_cache != cached_content ){
          handle(data_to_cache);
          Store(cache_key, str_to_cache);
        }
      }
    }

    if( cache_key ){
      /*require Store*/
      var data = Store(cache_key);
      if( data && data != 'null' && data != 'undefined' ){
        handle(JSON.parse(data));
      }
    }

    request.get(settings,function( res_txt ) {
      var data = check_data(res_txt);
      if( data ){
        handle(data);
      }
    });

    return {
      get : function() {
          return Store(cache_key);
      }
    };
  };

  function script () {
    return document.createElement('script');
  }

  function jsonp ( settings, done ) {
    if( !settings || !settings.url ){
      throw new Error('illegal params');
    }
    var callback_func_name = 'jsonp_' + Math.random().toFixed(12).slice(2);
    var data_str = ( settings.callbackname || 'callback' ) + '=' + callback_func_name;
    window[callback_func_name] = function( data ) {
      done(data);
    };
    var url = settings.url 
              + '?' + data_str +  ( settings.data ? ('&' + params(settings.data)) : '' );
    var spt = script();
    var head = document.getElementsByTagName('head')[0];
    var nodes= head.childNodes;
    var last = nodes[nodes.length - 1];
    head.insertBefore(spt, last);
    spt.src = url;
  }

  // exports util functions
  request.params = params;
  request.deparams = deparams;
  request.jsonp = jsonp;

  return request;
})();

if(module && module.exports){
  module.exports = ajax
}