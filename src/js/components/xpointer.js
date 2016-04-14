import * as Backbone from 'backbone';
import $ from 'jquery';

import Annotate from '../libraries/tei-xpointer/annotate';
import '../libraries/tei-xpointer/xpointer';

class XPointerComponent extends Backbone.View {

    // Components are model-less views
    
    // events() {
    //     return {
    //         'mouseup .cb-xf-controls > a' : 'remove'
    //     };
    // }

    initialize(options){

        this.editor = options.editor;
        this.shadowTags = options.shadowTags;
        this.shadowDOM = options.shadowDOM;

        // TODO: It's possible that the following could be handled with 
        // ACE's Selection API instead of relying on tokens
        $(this.editor.renderer.content).on("mouseup", (e)=>{
            e.preventDefault();
            
            let selection = this.editor.getSelection();
            let anchor = selection.selectionAnchor;
            let lead = selection.selectionLead;

            // Order selection so that the anchor is always before the focus (lead).
            let start, end;
            if (anchor.row < lead.row) {
                start = anchor;
                end = lead;
            }
            else if (anchor.row == lead.row) {
                if (anchor.column <= lead.column) {
                    start = anchor;
                    end = lead;
                }
                else {
                    start = lead;
                    end = anchor;
                }
            }
            else {
                start = lead;
                end = anchor;
            }

            let getShadowElement = (pos) => {
                let shadowEl = {}
                let token = this.editor.session.getTokenAt(pos.row, pos.column);

                let tokenRow = this.editor.session.getTokens(pos.row);                

                // TODO:
                // * empty element edge case
                // * error with selection before first char in string, maybe fixed by:
                // * move to closest (following?) text token when selection is on tag.

                var tags_stack = [];
                var startLocated = false;
                for (let [i, t] of tokenRow.entries()) {
                    if (t.type == "meta.tag.punctuation.tag-open.xml") {
                        tags_stack.push({
                            "token_no": i,
                            "value": tokenRow[i+1].value
                        });
                    }
                    else if (t.type == "meta.tag.punctuation.end-tag-open.xml") {
                        if (tokenRow[i+1].value == tags_stack[tags_stack.length-1].value){
                            tags_stack.pop();
                        }
                    }
                    
                    if (startLocated || t.start == token.start) {
                        startLocated = true;

                        if (t.type != "text.xml") {
                            continue;
                        }

                        let tstart = !t.start ? pos.column : t.start;
                        let tcol = pos.column < tstart ? tstart : pos.column;
                        shadowEl["offset"] = tcol - tstart;

                        // find closest token type meta.tag.punctuation.tag-open.xml
                        if (tags_stack.length > 0) {
                            for (let st of this.shadowTags){
                                let token_no = tags_stack[tags_stack.length-1].token_no
                                if (st.row == pos.row && st.token_no == tags_stack[tags_stack.length-1].token_no) {

                                    let intermediateNodes = tokenRow.slice(token_no,i+1).filter(function(subt){
                                        return subt.type == "text.xml";
                                    });

                                    shadowEl["$el"] = $(this.shadowDOM).find("*[xml\\:id='"+st.id+"']");
                                    shadowEl["el"] = shadowEl["$el"].get(0);

                                    // Also find text node for the pseudoSelection properties
                                    var textNodes = [];

                                    function _getTextNodes(node) {
                                        if (node.nodeType == 3) {
                                            textNodes.push(node);
                                        } else {
                                            for (var i = 0, len = node.childNodes.length; i < len; ++i) {
                                                _getTextNodes(node.childNodes[i]);
                                            }
                                        }
                                    }
                                    _getTextNodes(shadowEl["el"]);
                                    
                                    let intermediateIndex = Math.max(0, intermediateNodes.length-1);
                                    shadowEl["node"] = textNodes[intermediateIndex];
                                    return shadowEl;
                                }
                            }
                        }
                        else {
                            // TODO: not tested, not complete.
                            console.log("need to look at previous row...");
                        }
                        break;                    
                    }
                }
            }

            let startShadowEl = getShadowElement(start);
            let endShadowEl = getShadowElement(end);

            // TODO: Could this be a class?
            let pseudoSelection = {
                "startContainer" : startShadowEl["el"],
                "endContainer" : endShadowEl["el"],                
                "anchorOffset" : startShadowEl["offset"], 
                "anchorNode" : startShadowEl["node"], //nodes already ordered, so anchor == start
                "focusOffset" : endShadowEl["offset"],
                "focusNode" : endShadowEl["node"], //nodes already ordered, so focus == end
            };

            pseudoSelection["closestCommonAncestor"] = startShadowEl["$el"].parents().has(endShadowEl["$el"]).first();

            pseudoSelection["getRangeAt"] = function(i) {
                return this;
            }

            pseudoSelection["toString"] = function() {
                let textNodes = [];
                function _getTextNodes(node) {
                    if (node.nodeType == 3) {
                        textNodes.push(node);
                    } else {
                        for (var i = 0, len = node.childNodes.length; i < len; ++i) {
                            _getTextNodes(node.childNodes[i]);
                        }
                    }
                }
                _getTextNodes(this.closestCommonAncestor.get(0));

                let theString = "";
                let adding = false;
                for (let tn of textNodes){
                    if (tn === this.anchorNode && tn === this.focusNode){
                        theString += tn.data.slice(this.anchorOffset, this.focusOffset);
                        break;
                    }
                    else if (tn === this.anchorNode){
                        adding = true;                        
                        theString += tn.data.slice(this.anchorOffset);
                    }
                    else if (tn === this.focusNode){
                        adding = false;
                        theString += tn.data.slice(1, this.focusOffset);
                    }
                    else if (adding){
                        theString += tn.data;
                    }
                }

                return theString;
            }

            const xpointer = Annotate.xpointer(pseudoSelection);
            console.log(xpointer);
          });
    }

    // TODO: figure out recursion base case
    // getTextNodes(node, textNodes){
    //     if (!textNodes){
    //         let textNodes = [];
    //     }
    //     if (node.nodeType == 3) {
    //         textNodes.push(node);
    //     } else {
    //         for (var i = 0, len = node.childNodes.length; i < len; ++i) {
    //             this.getTextNodes(node.childNodes[i], textNodes);
    //         }
    //     }
    // }

}

export default XPointerComponent;