/* Utility for loading scripts that don't play well with ES6, babelify, and require :( */
/* Lightly adapted from Discourse JS code (GLP 2): 
https://github.com/discourse/discourse/blob/master/app/assets/javascripts/discourse/lib/load-script.js.es6 */

import $ from 'jquery';

const _loaded = {};
const _loading = {};

function loadWithTag(path, cb) {
  const head = document.getElementsByTagName('head')[0];

  let s = document.createElement('script');
  s.src = path;
  head.appendChild(s);

  s.onload = s.onreadystatechange = function(_, abort) {
    if (abort || !s.readyState || s.readyState === "loaded" || s.readyState === "complete") {
      s = s.onload = s.onreadystatechange = null;
      if (!abort) {
        cb();
      }
    }
  };
}

export default function loadScript(url, opts) {
  opts = opts || {};

  return new Promise(function(resolve) {
    // url = $.get(url);

    // If we already loaded this url
    if (_loaded[url]) { return resolve(); }
    if (_loading[url]) { return _loading[url].then(resolve);}

    var done;
    _loading[url] = new Promise(function(_done){
      done = _done;
    });

    _loading[url].then(function(){
      delete _loading[url];
    });

    const cb = function() {
      _loaded[url] = true;
      done();
      resolve();
    };

    // Some javascript depends on the path of where it is loaded (ace editor)
    // to dynamically load more JS. In that case, add the `scriptTag: true`
    // option.
    if (opts.scriptTag) {
      loadWithTag(url, cb);
    } else {
      $.get({url: url, dataType: "script", cache: true}).then(cb);
    }
  });
}