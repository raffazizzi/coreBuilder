/*
  For example:
    var parser = new SAXParser({
      startDocument: function() { ... },
      endDocument: function() { ... },
      startElement: function(node) { ... },
      endElement: function(node) { ... },
      characters: function(text) { ... },
      comment: function(comment) { ... }
    });

    parser.parse(editor);
*/

/* we expect to have the sax-js library available */
var SAXParser = function(callbacks) {

  this.reset = function() {
    var me = this;
    var parser = sax.parser(true, {
      xmlns: true,
      noscript: true,
      position: true
    });
    
    if(callbacks['error']) {
      parser.onerror = function(e) {
        callbacks.error.call(me, e);
        parser.resume();
      };
    }
    else {
      parser.onerror = function(e) {
        me.validationError((e.message.split(/\n/))[0] + ".");
        parser.resume();
      };
    }

    if(callbacks['characters']) {
      parser.ontext = function(t) {
        callbacks.characters.call(me, t);
      };
    }

    if(callbacks['startElement']) {
      parser.onopentag = function(node) {
        callbacks.startElement.call(me, node);
      };
    }

    if(callbacks['endElement']) {
      parser.onclosetag = function(name) {
        callbacks.endElement.call(me, name);
      };
    }

    if(callbacks['comment']) {
      parser.oncomment = function(comment) {
        callbacks.comment.call(me, comment);
      };
    }

    if(callbacks['startCdata']) {
      parser.onopencdata = function() {
      };
    }

    if(callbacks['cdata']) {
      parser.oncdata = function(cdata) {
      };
    }

    if(callbacks['endCdata']) {
      parser.onclosecdata = function() {
      };
    }

    if(callbacks['endDocument']) {
      parser.onend = function() {
        callbacks.endDocument.call(me);
      };
    }

    if(callbacks['startDocument']) {
      parser.onstart = function() {
        callbacks.startDocument.call(me);
      };
    }
    else {
      parser.onstart = function() { };
    }
  
    this.$parser = parser;
  };
};

SAXParser.prototype.parse = function(doc) {
  this.reset();
  var parser = this.$parser;
  // var i,
  //     n = doc.getLength();

  parser.onstart();
  
  // for(i = 0; i < n; i += 1) {
  //   parser.write(doc.getLine(i) + "\n");
  
  // }

  parser.write(doc).close();
};