import * as Backbone from 'backbone';
import Events from '../utils/backbone-events';
import $ from 'jquery';

import Annotate from '../libraries/tei-xpointer/annotate';
import '../libraries/tei-xpointer/xpointer';

class XPointerComponent extends Backbone.View {

    // Components are model-less views
    
    initialize(options){

        // XPOINTER STORED HERE
        this.xpointerdata;

        this.editor = options.editor;
        this.shadowTags = options.shadowTags;
        this.shadowDOM = options.shadowDOM;

        this.listenTo(this, "suspend", this.suspend);
        this.listenTo(this, "resume", this.resume);

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

        this.startEditorListener();
        
    }

    startEditorListener(){
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
            else if (startToken.type == "text.xml" && endToken.type == "text.xml") {
                // ok, selection allowed. 
                this.getXPointer(start, end);
            }
            else if (startToken.type != "text.xml" && startToken === endToken) {
                // Check adjacent token to deal with tag opening/closing edge case
                let nextToken = this.editor.session.getTokens(start.row)[startToken.index+1];
                let prevToken = this.editor.session.getTokens(start.row)[startToken.index-1];
                if (nextToken && prevToken) {
                    if (nextToken.type == "text.xml"){
                        start.edge = "next";
                        end.edge = "next";
                        this.getXPointer(start, end);
                    }
                    else if (prevToken.type == "text.xml"){
                        start.edge = "prev";
                        end.edge = "prev";
                        this.getXPointer(start, end);   
                    }
                    else { /* noop */ }
                }
                else { /* noop */ }            
            }
            else {
                let trouble = false;
                if (startToken.type != "text.xml"){
                    // Check immedately following token
                    // to deal with tag-close edge case
                    let nextToken = this.editor.session.getTokens(start.row)[startToken.index+1];
                    if (nextToken) {
                            if (!nextToken || nextToken.type != "text.xml"){
                            selection.clearSelection();
                            trouble = true;
                        }
                        else {
                            start.edge = "next";
                        }    
                    }
                    else trouble = true;                    
                }
                if (endToken.type != "text.xml"){
                    // Check immedately preceding token
                    // to deal with tag-open edge case
                    let prevToken = this.editor.session.getTokens(end.row)[endToken.index-1];
                    if (prevToken) {
                        if (!prevToken || prevToken.type != "text.xml"){
                            selection.clearSelection();
                            trouble = true;
                        }
                        else {
                            end.edge = "prev";
                        }
                    }
                    else trouble = true;
                }

                if (!trouble) {
                    this.getXPointer(start, end);   
                }
            }
        });
    }

    getXPointer(start, end) {

        let getShadowElement = (pos) => {

            let shadowEl = {};

            let offsetcol = pos.column;
            if (pos.edge) {
                if (pos.edge == "next") {
                    pos.column = pos.column + 1;
                }
                else pos.column = pos.column - 1;
            }

            let this_token = this.editor.session.getTokenAt(pos.row, pos.column);
            let this_offset = offsetcol - this_token.start;
            let totalOffset = this_offset;
            let text_stack = [];
            let lookingBack = false;

            // reverse loop through rows. 
            for (var row_i = pos.row; row_i >= 0; row_i--) {
                let tokenRow = this.editor.session.getTokens(row_i);

                let reduced_tRow = lookingBack ? tokenRow : tokenRow.slice(0, this_token.index+1);

                let tag;

                // reverse loop to locate parent element of text node
                // and stack text nodes
                let isClosed = false;
                for (var i = reduced_tRow.length - 1; i >= 0; i--) {
                    let t = reduced_tRow[i];

                    // stack text node lengths
                    if (t.type == "text.xml") {
                        if (i != reduced_tRow.length - 1) {
                            totalOffset += t.value.length;                            
                        }
                        if (i == reduced_tRow.length-1 && text_stack.length > 0) {
                            text_stack[0].unshift(t);
                        }
                        else {
                            text_stack.unshift([t]);
                        }
                    }
                    
                    else if (t.type == "meta.tag.punctuation.tag-open.xml") {
                        if (!isClosed) {
                            tag = {
                                "token_no": i+1,
                                "value": tokenRow[i+1].value
                            };
                            break;    
                        }
                        else isClosed = false;
                    }

                    else if ((t.type == "meta.tag.punctuation.tag-close.xml" && t.value == "/>") 
                      || t.type == "meta.tag.punctuation.end-tag-open.xml"){
                        isClosed = true;
                    }

                }

                if (tag) {

                    for (let st of this.shadowTags){
                        if (st.row == row_i && st.token_no == tag.token_no) {
                            shadowEl["$el"] = $(this.shadowDOM).find("*[xml\\:id='"+st.id+"']");
                            shadowEl["el"] = shadowEl["$el"].get(0);
                            
                            // Find text node.
                            // Get all the shadow text nodes contained by this element, 
                            // to the index eq to the length of text.xml tokens

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
                            _getTextNodes(shadowEl["el"]);

                            let relevant_tns = textNodes.slice(0, text_stack.length);
                            shadowEl["node"] = relevant_tns[relevant_tns.length-1]

                            let last_text_token = text_stack[text_stack.length-1]
                            if (last_text_token.length == 1){
                                shadowEl["offset"] = this_offset;
                            }
                            else {
                                let count = 0;
                                for (let t of last_text_token.slice(0, -1)) {
                                    count += t.value.length +1; //for the new line

                                }
                                count += this_offset;
                                shadowEl["offset"] = count;
                            }

                            // Store the totalOffset too just in case.
                            shadowEl["totalOffset"] = totalOffset;

                            return shadowEl;

                        }
                    }

                    break
                }
                else {
                    // add new line to offset count
                    totalOffset += 1;
                    lookingBack = true;
                }
            }

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

        if (startShadowEl["el"].getAttribute("xml:id") == endShadowEl["el"].getAttribute("xml:id")) {
            pseudoSelection["commonAncestorContainer"] = startShadowEl["el"];    
        }
        else {
            pseudoSelection["commonAncestorContainer"] = startShadowEl["$el"].parents().has(endShadowEl["$el"]).first().get(0);
        }

        pseudoSelection["getRangeAt"] = function(i) {
            // returning this should be sufficient becuase 
            // the xpointer library only requests getRangeAt(0)
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
            _getTextNodes(this.commonAncestorContainer);

            // Build the string starting at the anchor node and 
            // stopping at the focus node
            let theString = "";
            let canAdd = false;
            for (let tn of textNodes){
                if (tn === this.anchorNode && tn === this.focusNode){
                    // start and end text nodes are the same
                    theString = tn.textContent.slice(this.anchorOffset, this.focusOffset);
                    break;
                }
                else if (tn === this.anchorNode){         
                    canAdd = true;
                    theString = tn.textContent.slice(this.anchorOffset);
                }
                else if (tn === this.focusNode){
                    theString += tn.textContent.slice(0, this.focusOffset);
                    break;
                }
                else if (canAdd){
                    theString += tn.textContent;
                }
            }

            return theString;
        }

        try {
            const xpointer = Annotate.xpointer(pseudoSelection);
            // check xpointer
            if (xpointer) {
                this.xpointerdata = xpointer;
                this.$el.find(".cb-xf-xp-msg")
                    .text("XPointer created, add?")
                    .parent().removeClass("cb-xp-fail")
                    .addClass("cb-xp-ok");            
            }
            else {
                this.$el.find(".cb-xf-xp-msg")
                    .text("Could not create XPointer.")
                    .parent().removeClass("cb-xp-ok")
                    .addClass("cb-xp-fail");
            }
            return xpointer;
        }
        catch (msg) {
            this.$el.find(".cb-xf-xp-msg")
                .text("Could not create XPointer.")
                .parent().removeClass("cb-xp-ok")
                .addClass("cb-xp-fail");

            console.log(msg);
        }

    }

    suspend(){
        // console.log('suspending');
        $(this.editor.renderer.content).off("mouseup");
    }

    resume(){
        console.log('resuming');
        // reset exising pointer data
        this.xpointerdata = undefined;
        this.$el.find(".cb-xf-xp-msg").text("Make a selection").parent().removeClass("cb-xp-fail").removeClass("cb-xp-ok");
        this.startEditorListener();
    }

}

export default XPointerComponent;