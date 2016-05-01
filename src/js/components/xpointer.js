import * as Backbone from 'backbone';
import $ from 'jquery';

import Annotate from '../libraries/tei-xpointer/annotate';
import '../libraries/tei-xpointer/xpointer';

class XPointerComponent extends Backbone.View {

    // Components are model-less views
    
    initialize(options){

        this.editor = options.editor;
        this.shadowTags = options.shadowTags;
        this.shadowDOM = options.shadowDOM;

        this.editor.on("focus", () => {
            for (let txt of $(this.editor.renderer.content).find(".ace_text.ace_xml")){
                // if ($(txt).text().replace(/\s+/g, '') != ''){
                //     $(txt).css('background-color', "#dce3ea");                       
                // }
            }
        });

        this.editor.session.on("changeScrollTop", () => {
            for (let txt of $(this.editor.renderer.content).find(".ace_text.ace_xml")){
                // if ($(txt).text().replace(/\s+/g, '') != ''){
                //     $(txt).css('background-color', "#dce3ea");                       
                // }
            }
        });

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

            let startToken = this.editor.session.getTokenAt(start.row, start.column);
            let endToken = this.editor.session.getTokenAt(end.row, end.column);

            if (!startToken || !endToken){
                selection.clearSelection();
            }
            else if (endToken.type != "text.xml") {
                // not on text
                selection.clearSelection();
            }
            else if (startToken.type != "text.xml"){
                // Check immedately following token
                // to deal with tag-close edge case
                let nextToken = this.editor.session.getTokens(start.row)[startToken.index+1];
                if (!nextToken || nextToken.type != "text.xml"){
                    selection.clearSelection();
                }
                else {
                    start = {"column": nextToken.start, "row": start.row}
                    this.getXPointer(start, end);
                }
            }
            else if (startToken.value.replace(/\s+/g, '') == '' ||
                     endToken.value.replace(/\s+/g, '') == ''){
                // in between elements
                selection.clearSelection();
            }
            else {
                // ok, selection allowed. 
                this.getXPointer(start, end);
            }
        });
    }

    getXPointer(start, end) {
        // TODO: Simplify and optimize this 
        let getShadowElement = (pos, tags_stack=[], totalOffset=0) => {
            let shadowEl = {};
            let tokenRow = this.editor.session.getTokens(pos.row);                

            let token = pos.column ? this.editor.session.getTokenAt(pos.row, pos.column) : null;

            var startLocated = false;
            for (let [i, t] of tokenRow.entries()) {
                if (t.type == "meta.tag.punctuation.tag-open.xml") {
                    tags_stack.push({
                        "token_no": i,
                        "value": tokenRow[i+1].value
                    });
                }
                else if (t.type == "meta.tag.punctuation.end-tag-open.xml") {
                    if (tokenRow[i+1] && tags_stack[tags_stack.length-1]){
                        if (tokenRow[i+1].value == tags_stack[tags_stack.length-1].value){
                            tags_stack.pop();
                        }
                    }                        
                }
                
                if (t.type == "text.xml") {
                    totalOffset += t.value.length;
                }

                let tstart = token ? token.start : null;
                if (startLocated // The cursor was on a tag and we're now at the following text node
                    || (!token && i == tokenRow.length-1) // We're looking back, so there's not token. 
                                                          // Make sure we're at the last token in the row
                    || t.start === tstart // We're at the row and token where the selection ends
                    ) {
                    startLocated = true;

                    // Skip if this is not a text node (e.g. selection cursor is on tag)
                    // If we're at the end in means that the cursor is after a tag 
                    // at the end of a line. In which case proceed.
                    if (t.type != "text.xml" && i < tokenRow.length-1) {
                        continue; //NB this jumps to the next token
                    }

                    // find closest token type meta.tag.punctuation.tag-open.xml
                    if (tags_stack.length > 0) {                            

                        if (pos.column) {
                            let tstart = !t.start ? pos.column : t.start;
                            let tcol = pos.column < tstart ? tstart : pos.column;
                            shadowEl["offset"] = tcol - tstart;
                        }  
                        else shadowEl["offset"] = totalOffset;                          

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
                        // Looking back
                        return getShadowElement({"row": pos.row-1}, tags_stack, totalOffset);
                    }
                    break;                    
                }
            }
            // empty row, lookback
            return getShadowElement({"row": pos.row-1}, tags_stack, totalOffset);
        }

        let startShadowEl = getShadowElement(start);
        let endShadowEl;
        if (start.row == end.row && start.column == end.column){
            endShadowEl = startShadowEl;
        }
        else {
            endShadowEl = getShadowElement(end);                
        }

        // TODO: Could this be a class?
        let pseudoSelection = {
            "startContainer" : startShadowEl["el"],
            "endContainer" : endShadowEl["el"],                
            "anchorOffset" : startShadowEl["offset"], 
            "anchorNode" : startShadowEl["node"], //nodes already ordered, so anchor == start
            "focusOffset" : endShadowEl["offset"],
            "focusNode" : endShadowEl["node"], //nodes already ordered, so focus == end
        };

        pseudoSelection["commonAncestorContainer"] = startShadowEl["$el"].parents().has(endShadowEl["$el"]).first().get(0);

        pseudoSelection["getRangeAt"] = function(i) {
            return this;
        }

        // TODO: review this; sometimes white spaces are skipped?
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
            _getTextNodes(this.commonAncestorContainer);

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
                    theString += tn.data.slice(0, this.focusOffset);
                }
                else if (adding){
                    theString += tn.data;
                }
            }

            return theString;
        }

        const xpointer = Annotate.xpointer(pseudoSelection);
        return xpointer;
    }

}

export default XPointerComponent;