// This code is compiled from Hugh Cayles' tei-xpointer.js: https://github.com/hcayless/tei-xpointer.js
// Using as licensed according to Eclipse Public License 1.0


var XPointer = {
  /* Takes a pointer string and attempts to resolve it in the current document.
   * returns an array containing the function name, the context node, and any other function arguments
   * parsed—so a regex is a RegExp, a number an integer, and so on.
   */
  parsePointer: function(pointer){
    //get pointer name
    var p = decodeURIComponent(pointer.replace(/^#/,''));
    var result = {fname:'',context:null,params:[]};
    result.fname = p.match(/^([^()]+)\(/)[1];;
    p = p.replace(result.fname,'').replace(/^\(/,'').replace(/\)$/,'');
    p = XPointer.split(p); 
    if (result.fname == "range") {
      for (var i = 0; i < p.length; i++) {
        if (p[i].trim().match(/^(left|right|string-index)/)) {
          result.params.push(XPointer.parsePointer(p[i].trim()));
        } else {
          result.params.push(XPointer.getNode(p[i].trim()));
        }
      }
      result.context = result.params.reduce(XPointer.findCommonAncestor); 
    } else {
      result.context = XPointer.getNode(p[0].trim());
      switch (result.fname) {
        case "match":
          result.params.push(new RegExp(p[1].replace(/ /g,'\\s+').replace(/\?/g,'\\?').replace(/\*/g,'\\*').replace(/^'/,'').replace(/'$/,''), 'g'));
          if (p[2]) {
            result.params.push(parseInt(p[2].trim()));
          } else {
            result.params.push(1);
          }
          break;
        case "string-index":
          result.params.push(parseInt(p[1].trim()));
          break
        case "string-range":
          result.params.push(parseInt(p[1].trim()));
          result.params.push(parseInt(p[2].trim()));
          break;
        case "xpath":
        case "left":
        case "right":
          break;
      }
    }
    return result;
  },
  escapeRe: function(regex) {
    
  },
  split: function(exprs) {
    exprs = exprs.replace(/\\'/g, "&apos;");
    var i,s;
    var ref = 0;
    var result = [];
    for (i=0,s=0; i < exprs.length; i++) {
      if (exprs.charAt(i) == '(') s++;
      if (exprs.charAt(i) == ')') s--;
      if (exprs.charAt(i) == "'") {
        if (s == 0) {
          s++;
        } else {
          s--;
        }
      } 
      
      
      if (exprs.charAt(i) == ',' && s == 0) {
        result.push(exprs.substring(ref,i).replace(/&apos;/g, "'"));
        ref = i + 1;
      }
      if (i == exprs.length - 1) {
        result.push(exprs.substring(ref).replace(/&apos;/g, "'"));
      }
    }
    return result;
  },
  findCommonAncestor: function(node1,node2) {
    var n1 = node1.fname? node1.context: node1;
    var n2 = node2.fname? node2.context: node2;
    if (n1 == n2) return n1;
    var p1 = n1.parentElement;
    var p2 = n2;
    if (p1 == p2) return p1;
    while (p1) {
      while (p2 = p2.parentElement) {
        if (p1 == p2) return p1;
      }
      p1 = p1.parentElement;
      p2 = n2;
    }
  },
  /* Takes an absolute XPath (or element id) and an optional context, and returns
   * the first matching node or throws an error. */
  getNode: function(xpath, context){ 
    if (!context) {
      context = document;
    }
    var result;
    if (xpath.match(/^\//) || xpath.match(/^id\(/)) { // it's actually an XPath, not an IDREF
      var xpr = document.evaluate(xpath.replace(/@xml:id/g,"@id"),context,null,XPathResult.FIRST_ORDERED_NODE_TYPE,null);
      result = xpr.singleNodeValue;
      if (!result) {
        throw "Unable to resolve XPath " + xpath
      }
    } else { // it's an IDREF
      result = jQuery("#" + xpath);
      if (result.length == 0) {
        throw "Could not match element id " + xpath;
      } else {
        result = result[0]; //unwrap, so we return the bare node
      }
    }
    return result; 
  },
  /* rightNode and leftNode perform the function of resolving the node referred to
   * by right() or left() when they are used in the context of a match() pointer. */
  rightNode: function(node) {
    if (node.nextSibling) {
      return node.nextSibling
    } else {
      var xpr = document.evaluate("following::node()[1]",node,null,XPathResult.FIRST_ORDERED_NODE_TYPE,null);
      if (xpr.singleNodeValue) {
        return xpr.singleNodeValue;
      }
    }
  },
  leftNode: function(node) {
    if (node.previousSibling) {
      return node.previousSibling
    } else {
      var xpr = document.evaluate("preceding::node()[1]",node,null,XPathResult.FIRST_ORDERED_NODE_TYPE,null);
      if (xpr.singleNodeValue) {
        return xpr.singleNodeValue;
      }
    }
  },
  /* Returns a Rangy Range covering the section of document referred to by the
   * pointer param. Side effect warning: left() and right() pointers passed to select
   * may cause the insertion of a new text node in the document, and the modification
   * of the pointer parameters context var. */
  select: function(pointer) {
    var range = rangy.createRange();
    switch(pointer.fname) {
      case "range":
        if (pointer.params[0].fname) {
          switch (pointer.params[0].fname) {
            case "left": // in a range, left() in param 1 just means "include me"
              range.setStartBefore(pointer.params[0].context);
              break;
            case "right": // right() in param 1 means "don't include me"
              range.setStartAfter(pointer.params[0].context)
              break;
            case "string-index":
              var positions = XPointer.getLocation(pointer.params[0].context,pointer.params[0].params[0],0);
              range.setStart(positions[0],positions[1]);
          }
        } else {
          range.setStart(pointer.params[0],0);
        }
        if (pointer.params[1].fname) {
          switch (pointer.params[1].fname) {
            case "left": // in a range, left() in param 1 means "exclude me"
              range.setEndBefore(pointer.params[1].context);
              break;
            case "right":
              range.setEndAfter(pointer.params[1].context)
              break;
            case "string-index":
              var positions = XPointer.getLocation(pointer.params[1].context,pointer.params[1].params[0],0);
              range.setEnd(positions[0],positions[1]);
              
          }
        } else {
          range.setEnd(pointer.params[1],0);
        }
        break;
      case "match":
        var match = XPointer.getMatchLocation(pointer.context,pointer.params[0],pointer.params[1]);
        range.setStart(match[0],match[1]);
        range.setEnd(match[2],match[3]);
        break;
      case "string-range":
        var positions = XPointer.getLocation(pointer.context,pointer.params[0],pointer.params[1]);
        range.setStart(positions[0],positions[1]);
        range.setEnd(positions[2],positions[3]);
        break;
      case "left":
        var sib = pointer.context.previousSibling;
        if (!sib || sib.nodeType != Node.TEXT_NODE) {
          var text = pointer.context.parentNode.insertBefore(document.createTextNode(""),pointer.context);
          range.setStart(text,0);
          range.setEnd(text,0);
        } else {
          range.setStart(sib, sib.length - 1);
          range.setEnd(sib, sib.length - 1);
        }
        pointer.context = range.startContainer.parentNode;
        break;
      case "right":
        var sib = pointer.context.nextSibling;
        if (!sib) {
          var text = pointer.context.parentNode.appendChild(document.createTextNode(""));
        } else if (sib.nodeType != Node.TEXT_NODE) {
          var text = pointer.context.parentNode.insertBefore(document.createTextNode(""),sib);
          range.setStart(text,0);
          range.setEnd(text,0);
        } else {
          range.setStart(sib, 0);
          range.setEnd(sib, 0);
        }
        pointer.context = range.startContainer.parentNode;
        break;
      case "string-index":
        var positions = XPointer.getLocation(pointer.context,pointer.params[0],0);
        range.setStart(positions[0],positions[1]);
        range.setEnd(positions[2],positions[3]);
        break;
      case "xpath":
        range.setStart(pointer.context.firstChild,0);
        if (pointer.context.lastChild.nodeType == Node.TEXT_NODE) {
          range.setEnd(pointer.context.lastChild,pointer.context.lastChild.length);
        } else {
          range.setEnd(pointer.context.lastChild,pointer.context.lastChild.innerText.length);
        }
        
    }
    return range;
  },
  /* given a context node, a string index, and a string length, find the node where the
   * string starts, its offset, the node where it ends, and its offset. These values
   * are returned in an array.
   */
  getLocation: function(contextNode, index, length){
    var result = [];
    var xpr;
    if (contextNode.childNodes && contextNode.childNodes.length > 0){
      xpr = document.evaluate(".//text()",contextNode,null,XPathResult.ORDERED_NODE_ITERATOR_TYPE,null);
      XPointer.locateNodes(xpr, index, length, result);
    }
    if (result.length < 4) {
      xpr = document.evaluate("following::text()",contextNode,null,XPathResult.ORDERED_NODE_ITERATOR_TYPE,null);
      XPointer.locateNodes(xpr, index, length, result);
    }
    return result;
  },
  locateNodes: function(xpr, index, length, result) {
    var node = xpr.iterateNext();
    var currentlen = 0;
    while (node) {
      currentlen += node.length;
      if (result.length == 0 && currentlen >= index) {
        result.push(node);
        result.push(index - (currentlen - node.length));
      }
      if (currentlen >= index + length) {
        result.push(node);
        result.push((index + length) - (currentlen - node.length));
        break;
      }
      node = xpr.iterateNext();
    }
    return result;
  },
  /* Given a context node, a RegExp, and the match number, finds the start and end nodes,
   * and the offsets within them where the match is located. Returns an array like getLocation(). */
  getMatchLocation: function(contextNode, re, index){
    var text;
    if (contextNode.childNodes.length == 0) {
      var following = [];
      var currNode = contextNode.nextSibling;
      while (currNode.localName != "lb") {
        following.push(jQuery(currNode).text());
        currNode = currNode.nextSibling;
      }
      text = following.join("");
    } else {
      text = jQuery(contextNode).text();
    }
    var matches = text.match(re);
    var matchindex = -1;
    for (var i = 0; i < index; i++) {
      matchindex = text.indexOf(matches[i], matchindex + 1);
    }
    return XPointer.getLocation(contextNode, matchindex, matches[index - 1].length);
  }
}

export default XPointer;