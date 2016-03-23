if (!Array.prototype.forEach) {
    Array.prototype.forEach = function (fn, scope) {
        for (var i = 0, len = this.length; i < len; ++i) {
            if (i in this) {
                fn.call(scope, this[i], i, this);
            }
        }
    };
}


/*global console*/

//
// loadScript.js defines loadScript(), a global function for performing asynchronous
// script loads.
//
// https://github.com/zynga/loadScript
// Author: Chris Campbell (@quaelin)
// License: BSD
//
(function (win, doc, undef) {
    'use script';

    var loadScript;
    var funcName = 'loadScript';
    var VERSION = '0.1.5';
    var had = Object.prototype.hasOwnProperty.call(win, funcName);

    var loading = {};
    var loaded = {};

    function log(msg) {
        if (typeof console !== 'undefined' && console && console.log) {
            console.log(msg);
        }
    }

    // Perform text substitutions on `origURL` according to the substitution
    // rules stored in localStorage `key` (if present).  This is a developer
    // feature; to use it, you must name the localStorage key by setting it like
    // this:
    //
    //   loadScript.key = 'loader_rules';
    //
    // Then you can set the corresponding value in localStorage to a JSON-ified
    // array of arrays, where each inner array is a pair of the form:
    //
    //   [searchtext, replacetext]
    //
    // This allows the developer to load, for instance, a newer or unminified
    // version of a particular script.
    function rewrite(origURL) {
        var substitutions = [], key = loadScript.key;
        if (key) {
            try {
                substitutions = JSON.parse(localStorage.getItem(key)) || [];
            } catch (ex) {
            }
        }
        var i = -1, len = substitutions.length, rule, url = origURL;
        while (++i < len) {
            rule = substitutions[i];
            url = url.replace(rule[0], rule[1]);
        }
        if (url !== origURL) {
            log(funcName + ': rewrite("' + origURL + '")');
            log(' => "' + url + '"');
        }
        return url;
    }

    // Here is the loadScript() function itself.
    loadScript = win[funcName] = function (requestURL, callback) {
        var
            el,
            // url = rewrite(requestURL),
            url = requestURL,
            needToLoad = !loading[url],
            q = loading[url] = loading[url] || []
        ;
        function doCallback( e ) {
            if (callback) {
                callback( e );
            }
        }
        if (loaded[url]) {
            doCallback();
            return;
        }
        q.push(doCallback);
        function onLoad( e ) {
            loaded[url] = 1;
            while (q.length) {
                q.shift()( e );
            }
        }
        if (needToLoad) {
            el = doc.createElement('script');
            el.type = 'text/javascript';
            el.charset = 'utf-8';
            if (el.addEventListener) {
                el.addEventListener('load', onLoad, false);
            } else { // IE
                el.attachEvent('onreadystatechange', onLoad);
            }
            el.setAttribute('data-requested', requestURL);
            
            el.src = url;
            doc.getElementsByTagName('head')[0].appendChild(el);
        }
    };
    
}(this, document));

!function(window) {

/**
* 对本地存贮对象的操作封装
*/

function isLocalStorageSupported() {
    try { 
      var supported = ('localStorage' in window && window.localStorage);
      var name = "__store";
      if (supported) {
        localStorage.setItem(name, "");
        localStorage.removeItem(name);
        return supported;
      }
    } catch(err) {
        return false;
    }
}

var Store = function(key, value) {
    var storage = Store.get();
    if (storage) {
        if ('undefined' === typeof value) {
            return storage.getItem(key);
        } else {
            storage.setItem(key, value);
        }
    }
};

Store.isSupport = isLocalStorageSupported();

var virtual_storage = (function(){
  var data = {};
  return {
    getItem : function( k ) {
        if( (k in data) && data.hasOwnProperty(k) ){
            return data[k];
        }
    },
    setItem : function( k, v ) {
        data[k] = v;
    },
    removeItem : function(k) {
        if( (k in data) && data.hasOwnProperty(k) ){
            try{
                delete data[k];
                return true;
            } catch(e){
                return false;
            }
        }
        return false;
    }
  };
})();

Store.get = function() {
    if (Store.isSupport) {
        var _localStorage = window.localStorage;
        Store.get = function() {
            return _localStorage;
        }
        return _localStorage;
    } else {
        return virtual_storage;
    }
};


/**
 * 清除本地存贮数据
 * @param {String} prefix 可选，如果包含此参数，则只删除包含此前缀的项，否则清除全部缓存
 */
Store.clear = function(prefix) {
    var storage = Store.get();
    if (storage) {
        if (prefix) {
            for (var key in storage) {
                if (0 === key.indexOf(prefix)) {
                    storage.removeItem(key);
                }
            }
        } else {
            storage.clear();
        }
    }
};

window.Store = Store;

}(window);

(function(window) {

    var groupArray = function(arr, num, fill) {
        // arr = [] || num = 0
        if (!arr.length || !num) return arr;

        // 返回的数组
        var arr_back = [];
        // 数组的任一元素
        var item;
        // 数组的任一分组
        var column = [];
        function next(i) {
            if ((item = arr[i]) === undefined) return;

            column.push(item);

            // 最后一个元素
            if (i == arr.length-1) {
                // 用空串填满数组
                if (fill)
                    while(column.length < num) column.push({pass: true});
                arr_back.push(column);
                return;
            }

            // 完成一个分组
            if (column.length == num) {
                arr_back.push(column);
                column = [];
            }

            next(++i);
        }
        next(0);
        return arr_back;
    };

    var require; 
    var define;

    var head = document.getElementsByTagName('head')[0];
    var loadingMap = {};
    var factoryMap = {};
    var modulesMap = {};
    var resMap;
    var pkgMap;
    var isStorageSupport = Store.isSupport;
    var comboSyntax = ["??", ","];
    var comboServe = "/combo";
    var storePrefix = "mocket-";
    var urlPrefix = "";
    var search = location.search || "";

    // 最大combo资源数，默认10个
    var maxComboNum = 10;

    // 屏蔽读取storage，便于开发
    // 1) window.ignoreStore = true
    // 2) URL中有ignoreStore
    var ignoreStore = window.ignoreStore || search.match(/ignoreStore/);
    var isClearStore = search.match(/clearStore/);

    var interactiveScript;

    // 执行代码片段
    function exec(s) {
        (new Function(s))();
    }

    // 获取存储的模块集合
    function getStores() {
        var stores = {};
        var storage = Store.get();
        for (var key in storage) {
            if (0 === key.indexOf(storePrefix)) {
                stores[key.substr(storePrefix.length)] = storage[key];
            }
        }
        return stores;
    }

    // 拼接combo的url
    function getComboURI(requires) {
        var start = comboSyntax[0]; // ??
        var sep = comboSyntax[1]; // ,

        return comboServe + start + requires.join(sep);
    }

    // 将执行中的define函数，以字符串形式输出存储
    function stringify(id, factory) {
        return "define('" + id + "'," + factory.toString() + ");";
    };

    // 通过静态资源id从resMap中获取实际url
    function getStaticURI(id) {
        var res = (resMap || {})[id] || {};
        return res['url'] || res['uri'] || id;
    };

    function clearStore() {
        Store.clear(storePrefix);
    };


    function scripts() {
        return document.getElementsByTagName('script');
    }

    function basename( url ) {
        var _url = new URL(url);
        var name = _url.pathname.split('/').pop();

        return name.split('.').unshift();
    }

    function eachReverse(ary, func) {
        if (ary) {
            var i;
            for (i = ary.length - 1; i > -1; i -= 1) {
                if (ary[i] && func(ary[i], i, ary)) {
                    break;
                }
            }
        }
    }

    function getInteractiveScript() {
        if (interactiveScript && interactiveScript.readyState === 'interactive') {
            return interactiveScript;
        }

        eachReverse(scripts(), function (script) {
            if (script.readyState === 'interactive') {
                return (interactiveScript = script);
            }
        });
        return interactiveScript;
    }

    var globalDefQueue = [];

    var globalWaitingList = {};
    // 
    // 这里假设不存在异步加载有alias的模块如果有 在这里之前需要调用normalize
    // 
    // 加载前在此注册占位，并且注册回调，如果有合并请求的也如此做，但是不写回调。
    // 
    function get_module_loading( id ) {
        var mod;
        if(id in globalWaitingList && globalWaitingList.hasOwnProperty(id)){
            mod = globalWaitingList[id];
        } else {
            mod = globalWaitingList[id] = { id : id, callback : []};
        }
        return mod;
    }

    function check_loading( id ) {
        return (id in globalWaitingList);
    }

    define = function(id, factory) {
        if( arguments.length == 1 ){
            factory = id;
            id = null;
            var scp = getInteractiveScript();
            if( scp ){
                var scp_src = scp.src;
                id = basename(scp_src);
            } else {
                // just for wechat jsapi
                globalDefQueue.push([id, factory]);
            }
        }

        if( !id ){
            return;
        }

        factoryMap[id] = factory;

        if (!isClearStore && isStorageSupport) {
            var storeId = storePrefix + getStaticURI(id);

            if (!Store(storeId)) {
                Store(storeId, stringify(id, factory));
            }
        }
    };

    require = function(id) {
        id = require.alias(id);

        var mod = modulesMap[id];
        if (mod) {
            return mod['exports'];
        }

        //
        // init module
        //
        var factory = factoryMap[id];
        if (!factory) {
            throw Error('Cannot find module `' + id + '`');
        }

        mod = modulesMap[id] = {
            'exports': {}
        };

        //
        // factory: function OR value
        //
        var ret = (typeof factory == 'function') ? factory.apply(mod, [require, mod['exports'], mod]) : factory;

        if (ret) {
            mod['exports'] = ret;
        }
        return mod['exports'];
    };

    // 
    // 此处会加载三个来源
    // 已经加载的
    // 在localstorage里的
    // 在远程路径里的
    // 
    var async_id = 0;
    require.async = function(names, callback) {
        var _async_id = async_id++;

        if (typeof names == 'string') {
            names = [names];
        }
        // console.log( 'load modules', names );

        for (var i = names.length - 1; i >= 0; --i) {
            names[i] = require.alias(names[i]);
        }

        var needMap = {};
        var needURLMap = [];
        var stores = getStores();
        var needLoad = [];
        
        var hasStored = [];
        findNeed(names);

        // console.log( needURLMap );

        updateStore();

        var needNum = 0;

        if (needLoad.length) {
            console.log( _async_id, "modules length:", needLoad.length)
            groupNeed();
        }

        hasStored.forEach(function(i) {
            exec(stores[i]);
        });

        // 按顺序传递参数执行
        var module_loaded = function () {
            // console.log( _async_id, 'module_loaded', names);
            module_loaded = function() {};

            var modules = [];
            names.forEach(function(item) {
                modules.push(require(item));
            });
            callback.apply(window, modules);
        }

        if ( needNum == 0 ){
            module_loaded();
            return;
        }

        function findNeed(depArr) {
            for (var i = depArr.length - 1; i >= 0; --i) {
                //
                // skip loading or loaded
                //
                var dep = depArr[i];
                var url = getStaticURI(dep);

                // console.log(
                //     _async_id,
                //     dep,
                //     '!(dep in modulesMap) ', !(dep in modulesMap),
                //     '!(dep in needMap)',     !(dep in needMap)
                // );

                if ( 
                    !(dep in modulesMap) 
                    // 去重
                    && !(dep in needMap)
                ) {
                    needMap[dep] = true;
                    if (!url.match(/\.css$/)){ 
                        needURLMap.push(url);
                    }

                    var child = resMap[dep];
                    if (child && child.deps) {
                        var deps = child.deps;
                        for (var j = deps.length - 1; j >= 0; --j) {
                            deps[j] = require.alias(deps[j]);
                        }
                        findNeed(deps);
                    }
                }
            }
        }

        function updateStore() {
            needURLMap.forEach(function(item) {
                if (!ignoreStore && (item in stores)) {
                    hasStored.push(item);
                } else {
                    needLoad.push(item);
                }
            });
        }

        
        function updateNeed( e ) {
            // to resolve amd anonymous define modules
            // just for weixin jsapi
            if( globalDefQueue.length ){
                var defines = globalDefQueue.slice();
                defines.forEach(function( context ) {
                    if( context[0] ){
                        factoryMap[ context[0] ] = context[1];
                    } else {
                        if( e && e.target ){
                            factoryMap[ e.target.getAttribute('data-requested') ] = context[1];
                        }
                    }
                });
                globalDefQueue = [];
            }

            if (0 == --needNum) {
                module_loaded();
            }
        }

        function groupNeed() {
            var still_need = [];
            for(var i = 0; i < needLoad.length; i++) {
                if( check_loading(needLoad[i]) ){
                    needNum += 1;
                    get_module_loading(needLoad[i]).callback.push(updateNeed);
                } else {
                    get_module_loading(needLoad[i]);
                    still_need.push(needLoad[i]);
                }
            }


            var groups = groupArray(still_need, maxComboNum);
            var files;

            // console.log( _async_id, 'loading scripts ', still_need );
            needNum += groups.length;

            // console.log( _async_id, 'loading', needNum );

            function make_callback( files ) {
                return function( e ) {
                    updateNeed(e);
                    files.forEach(function( id ) {
                        var mod = get_module_loading(id);
                        if( mod.callback.length ){
                            mod.callback.forEach(function( callback ) {
                                callback(e);
                            });
                        }
                    });
                };
            }

            for(var i = 0; i < groups.length; i++) {
                files = groups[i];
                loadScript(files.length > 1 ? getComboURI(files) : files[0], make_callback(files));
            }
        }
    };

    require.resourceMap = function(obj) {
        resMap = obj['res'] || {};
        pkgMap = obj['pkg'] || {};
    };

    require.alias = function(id) {
        if (!id.match(/\.css$/)) {
            id = id.replace(/\.js$/, "") + ".js";
        }
        return id;
    };

    require.config = function(data) {
        data.comboSyntax && (comboSyntax = data.comboSyntax);
        data.comboServe && (comboServe = data.comboServe);
        /boolean/i.test(typeof data.ignoreStore) && (ignoreStore = data.ignoreStore);
        data.maxComboNum && (maxComboNum = data.maxComboNum);
        data.urlPrefix && (urlPrefix = data.urlPrefix);
    };

    define.amd = {
        'jQuery': true,
        'version': '1.0.0'
    };

    if (isClearStore) {
        clearStore();
    }

    window.require = require;
    window.define = define;

})(window);