window.broadcast = window.broadcast || (function(){
  var events = [];

  var noop = function() {};
  var slice = [].slice;

  function get_handlers(name) {
    return events[name] = events[name] || [];
  }

  var ret = {
    on : function(name, handler) {
      get_handlers(name).push(handler);
    },

    once : function(name, handler) {
      var once = function () {
        var res = handler.apply(this, slice.call(arguments));
        // remove self;
        ret.off(name, once);
        return res;
      };

      get_handlers(name).push(once);
    },

    off  : function(name, handler) {
      if( !handler ){
        get_handlers(name).length = 0;
      } else {
        var handlers = get_handlers(name);
        handlers = handlers.splice( handlers.indexOf(handler), 1);
      }
    },

    fire : function(name, data, callback, self) {
      if(arguments.length == 1){
        data = {};
        callback = noop;
        self = null;
      } else if(arguments.length == 2){
        callback = noop;
        self = null
      } else if( arguments.length == 3){
        if(typeof callback == 'function'){
          self = null;
        } else {
          self = callback;
          callback = noop;
        }
      }

      // 
      // 兼容原来的一些用法
      // 

      // 拷贝出来， 否则once或者其他移除handler的方法会影响此次执行。
      var list = get_handlers(name).slice();
      var i, len, func, k;
      var e = {};
      for(k in data){
        if( data.hasOwnProperty(k)){
          e[k] = data[k];
        }
      }

      callback = e.callback || e.cb || callback;

      var stop = false;
      e.stopImmediatePropagation = function() {
        stop = true;
      };

      var _cb = e.callback = function() {
        callback.apply(null,slice.call(arguments));
      };

      for(i = 0, len = list.length; i< len;i++){
        func = list[i];

        try{
          func.apply(self, [e, _cb]);
        }catch(e){
          console.error(e);
        }

        if( stop ){
          break;
        }
      }
    }
  };

  return ret;
})();