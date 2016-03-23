var dom = (function(){


  var slice = function( arrlike ) {
    return [].slice.call(arrlike);
  };

  function isWindow(element) {
    return element == element['window'];
  }

  function isDocument(obj)   { return obj != null && obj.nodeType == obj.DOCUMENT_NODE }

  var documentElement = document.documentElement;

  var matches = documentElement.matches ||
                documentElement.webkitMatchesSelector ||
                documentElement.mozMatchesSelector ||
                documentElement.oMatchesSelector ||
                documentElement.msMatchesSelector;

  function matchSelector ( node, selector) {
    return matches.call(node, selector);
  }

  var dom = function( selector, context ) {
    if( !(this instanceof dom) ){
      return new dom(selector, context);
    }

    context = context || document;
    var ret;

    if( selector instanceof dom ){
      return selector;
    }

    if( selector instanceof Element ){
      ret = [selector];
    } else if(isWindow(selector)) {
      ret = [window];
    } else if( typeof selector != 'string' ){
      if( selector.length && selector.slice ){
        ret = selector;  
      }else{
        throw new Error('selector must be strings');
      }
    } else if( selector.indexOf('<') != -1 ){
      ret = this.buildFragment(selector);
    } else if( !context.querySelectorAll ){
      ret = dom(context).find(selector);
    } else {
      ret = slice(context.querySelectorAll(selector));
    }

    var length = this.length = ret.length;
    for(var i = 0; i < length; i ++){
      this[i] = ret[i];
    }
  };

  var dp = dom.prototype;

  dp.buildFragment = function( html ) {
    var div = document.createElement('div');
    div.innerHTML = html;
    var ret = slice(div.children);

    while(div.firstChild){
      div.removeChild(div.firstChild);
    }

    return ret;
  };

  dp.appendTo = function( parent ) {
    if( typeof parent == 'string'){
      parent = dom(parent);
    }
    if( parent instanceof dom ){
      parent = parent[0];
    }

    this.each(function(i, node ) {
      parent.appendChild( node );
    });
    return this;
  };

  dp.find = function( selector ) {
    var ret = [];
    this.each(function( idx, node ) {
      var nodes = slice(node.querySelectorAll(selector));
      for(var i=0; i< nodes.length; i ++){
        ret.push(nodes[i]);
      }
    });
    return dom(ret);
  };

  dp.each = function( handle ) {
    for(var i = 0;i < this.length; i ++ ){
      handle.call(this[i], i, this[i]);
    }
    return this;
  };

  dp.css = function( key, val ) {
    if( arguments.length == 2 ){
      this.each(function(idx, node) {
        node.style[key] = val;
      });
    } else if( arguments.length == 1 && typeof key == 'object' ){
      this.each(function(idx, node) {
        for(var k in key){
          node.style[k] = key[k];
        }
      });
    }
    return this;
  };

  var computed = function(el){
    return document.defaultView.getComputedStyle(el, null);
  };

  dp.computedStyle = function() {
    return computed(this[0], null);
  };

  dp.patchMarginTop = function() {
    this.each(function(idx, node) {
      var s = computed(node);
      var marginTop = s.marginTop;
      if( marginTop.indexOf('%') != -1 ){
        var full_width = computed(node.parentNode).width;
        full_width = parseInt(full_width);
        marginTop = parseInt(marginTop) / 100;
        marginTop = marginTop * full_width;
        node.style.marginTop = marginTop + 'px';
      }
    });
  };

  dp.style = dp.css;

  dp.show = function() {
    this.style('display', 'block');
    return this;
  };

  dp.hide = function() {
    this.style('display', 'none');
    return this;
  };

  dom.extend =  function() {
    var src, copy, name, options,
      target = arguments[ 0 ] || {},
      i = 1,
      length = arguments.length,
      deep = false;

    // Handle a deep copy situation
    if ( typeof target === "boolean" ) {
      deep = target;
      target = arguments[ 1 ] || {};

      // skip the boolean and the target
      i = 2;
    }

    // Handle case when target is a string or something (possible in deep copy)
    if ( typeof target !== "object" && !(typeof  target == 'function') ) {
      target = {};
    }

    // extend jQuery itself if only one argument is passed
    if ( length === i ) {
      target = this;
      --i;
    }

    for ( ; i < length; i++ ) {

      // Only deal with non-null/undefined values
      if ( ( options = arguments[ i ] ) != null ) {

        // Extend the base object
        for ( name in options ) {
          src = target[ name ];
          copy = options[ name ];

          // Prevent never-ending loop
          if ( target === copy ) {
            continue;
          }

          target[ name ] = copy;
        }
      }
    }

    // Return the modified object
    return target;
  };

  dp.on = function( ev, selector, handle ) {
    if( ev != 'click' ){
      throw new Error('only support click');
    }

    this.click(function( e ) {
      var t = e.target;
      var matched = false;

      while( t && t != this ){
        if( matchSelector(t, selector ) ){
          matched = true;
          break;
        }
        t = t.parentNode;
      }

      if( matched ){
        handle.call(t, e);
      }
    });
  };


  dp.click = function( handle ) {
    if( !arguments.length ){
      this.each(function(i, node) {
        node.click();
      });
    } else {
      this.each(function(i, node) {
        node.addEventListener 
          ? node.addEventListener('click', handle)
          : node.attachEvent('click', handle);
      });
    }
    return this;
  };


  dp.html = function( html ) {
    if( arguments.length ){
      this.each(function( idx, node ) {
        node.innerHTML = html;
      });
      return this;
    } else if ( this.length ){
      return this[0].innerHTML;
    }
  };

  function className(node, value){
    var klass = node.className || '';
    var svg   = klass && klass.baseVal !== undefined;

    if (value === undefined){
      return svg ? klass.baseVal : klass;
    }

    if( svg ){
      klass.baseVal = value;
    } else {
      node.className = value;
    }
  }
  function classRe(name) {
    return new RegExp('(^|\\s)' + name + '(?:\\s|$)');
  }

  function parseNames(name) {
    return name.split(/\s+/).map(function( name ) {
      return {
        name : name,
        reg  : classRe(name)
      }
    });
  }

  dp.addClass = function( name ) {
    if (!name){ 
      return this;
    }

    name = parseNames(name);

    return this.each(function(idx, node){
      if (!('className' in node)){
       return;
      }

      var classes = className(node);
      name.forEach(function( pair ) {
        if( !pair.reg.test(classes) ){
          classes += ' ' + pair.name;
        }
      });
      className(node, classes);
    });
    return this;
  };

  dp.removeClass = function( name ) {
    if (!name){ 
      return this;
    }

    name = parseNames(name);

    return this.each(function(idx, node){
      if (!('className' in node)){
       return;
      }

      var classes = className(node);
      name.forEach(function( pair ) {
        if( pair.reg.test(classes) ){
          classes = classes.replace(pair.reg, ' ');
        }
      });
      classes = classes.replace(/\s+/g,' ').trim();
      className(node, classes);
    });
    return this;
  };

  dp.attr = function( attr, val ) {
    if( arguments.length == 0 ){
      throw new Error('argument must given');
    } else if ( arguments.length == 2 ){
      this.each(function(idx, node) {
        node.setAttribute(attr, val);
      });
    } else if ( arguments.length == 1 && this.length ){
      return this[0].getAttribute(attr);
    }
    return this;
  }

  dp.remove = function() {
    this.each(function( idx , node ) {
      node.parentNode.removeChild(node);
    });
    return this;
  }

  dp.hasClass =  function(value) {
    var classes = (value || '').match(/\S+/g) || [],
      len = classes.length;
    for (var i = 0, j, l = this.length; i < l; i++) {
      for  (j = 0; j < len; j++) {
        if ((' ' + this[i].className.replace(/\s+/g, ' ') + ' ').indexOf(' ' + classes[j] + ' ') > -1) {
          return true;
        }
      }
    };
    return false;
  };


  /**
   * Escape the given string of `html`.
   *
   * @param {String} html
   * @return {String}
   * @api private
   */

  var encode_html_rules = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;'
  };
  var match_html = /[&<>"]/g;

  function encode_char(c) {
    return encode_html_rules[c] || c;
  }

  function escapeHtml(html){
    var result = String(html).replace(match_html, encode_char);
    if (result === '' + html){
      return html;
    } else {
      return result;
    }
  };

  dom.escapeHtml = dp.escapeHtml = escapeHtml;
  return dom;
})();

if(module && module.exports ){
  module.exports = dom;
}
