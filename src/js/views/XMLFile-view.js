import $ from 'jquery';
import * as Backbone from 'backbone';
import Events from '../utils/backbone-events';
import loadScript from '../utils/load-script';
import xmlfile_tpl from '../templates/xmlfile-tpl';
import XPointerComponent from '../components/xpointer';

class XMLFileView extends Backbone.View {

    get className() {
        return "cb-XMLFile";
    }

    events() {
        return {
            'click .cb-xf-controls > a' : 'remove'
        };
    }

    initialize(options) {
    	this.listenTo(Events, "XMLFile:resize", this.resize)
        // This is temporary until I introduce a XPointer mode / button
        this.xmlDOM = (new DOMParser()).parseFromString(this.model.get("content"), "text/xml");
        // Create an array of new ids
        this.gen_ids = [];
        this.gen_ids_clone = [];
        this.shadowTags = [];
        // Add missing xml:ids to the shadow dom.
        for (let no_id of $(this.xmlDOM).find("*:not([xml\\:id])")){
            var random_id = ("0000" + (Math.random()*Math.pow(36,4) << 0).toString(36)).slice(-6);
            random_id = "cb_" + random_id;
            this.gen_ids.push(random_id);
            this.gen_ids_clone.push(random_id);
            no_id.setAttribute("xml:id", random_id);
        }
    }

    resize(size) {

    	this.model.size = size;

    	this.$el.removeClass (function (i, css) {
            return (css.match (/(^|\s)col-\S+/g) || []).join(' ');
        });
        this.$el.addClass('col-xs-'+size);
    }

    bindSelect(editor) {
        $(editor.container).click((e) => {
            e.stopPropagation();

            // Remove any element selectors
            this.$el.find("#cb-el_select").remove();

            let pos = editor.getCursorPosition();
            let token = editor.session.getTokenAt(pos.row, pos.column);
            let tokenRow = editor.session.getTokens(pos.row);
            let xmlid = "";

            if (token){
                if (token.type == "entity.other.attribute-name.xml" && token.value == 'xml:id') {
                    for (let tk of tokenRow.slice(token.index)){
                        if (tk.type == "string.attribute-value.xml") {
                            xmlid = tk.value;
                            xmlid = xmlid.replace(/['"]/g, "");
                            break;
                        }
                    }
                }
                else if (token.type == "string.attribute-value.xml") {
                    // old school reverse loop
                    for (var i = token.index; i >= 0; i--) {
                        if (tokenRow[i].type == "entity.other.attribute-name.xml") {
                            if (tokenRow[i].value == 'xml:id') {
                                xmlid = token.value;
                                xmlid = xmlid.replace(/["']/g, "");                                
                            }
                            break;
                        }
                    }                    
                }
            }
            if (xmlid){
                let find_q = "*[xml\\:id=" +xmlid+ "]";
                let xmlel = $(this.xmlDOM).find(find_q);

                let tagName = xmlel.prop("tagName");
                let popup = $('<button type="button" class="btn btn-default" id="cb-el_select">Add element: ' + tagName + '</button>');
                
                let parentOffset = this.$el.parent().offset();
                let offset = this.$el.offset();

                popup.css({
                    'position' : 'absolute',
                    'left' : e.pageX - offset.left,
                    'top' : e.pageY - parentOffset.top,
                    'z-index': 999
                }); 

                this.$el.append(popup);

                popup.click( (e) => {
                    e.stopPropagation();
                    Events.trigger("coreEntry:addPointer", 
                        {
                            'xml_file': this.model.get("filename"),
                            'cb_xml_file_model' : this.model.cid,
                            'ident' : tagName,
                            'xmlid' : xmlid,
                            'pos'   : pos      
                        });
                    popup.remove();
                });
            }
        });
    }

    render() {
    	this.$el.addClass('col-xs-'+this.model.size);

        this.$el.append(xmlfile_tpl(this.model.toJSON()));

        // const ed_cnt = this.el;
        const ed_cnt = this.$el.find(".cb-ace").get(0);

        // TODO: Determine here if XML?
        // TODO: need to parametrize ace URL somehow, or make generally more reliable
        loadScript("/dist/js/libs/ace/ace.js", { scriptTag: true }).then(() => {
            var editor;
            ace.require(['ace/ace'], (loadedAce) => {
                editor = loadedAce.edit(ed_cnt);

                editor.setTheme("ace/theme/chrome");
                editor.setShowPrintMargin(false);
                editor.setReadOnly(true)
                editor.getSession().setMode("ace/mode/xml");
                editor.$blockScrolling = Infinity;
                editor.$enableBlockSelect = false;
                editor.$enableMultiselect = false;
                editor.getSession().insert({column:0, row:0}, this.model.get("content"));
                editor.moveCursorTo({column:0, row:0});
            });

            this.bindSelect(editor);

            // This is temporary until I introduce a XPointer mode / button
            // Use a SAX parser approach to build a table of tags with ids corresponding to the shadow DOM
            // var listened = false;
            // editor.getSession().on("changeAnnotation", () => {
            //     if (!listened){
            //         listened = true;
            //         var rows = editor.session.getDocument().getLength();
            //         rows = Array.from(new Array(rows), (x,i) => i);
            //         for (let row of rows) {
            //             let tokens = editor.session.getTokens(row);
            //             // console.log(tokens);

            //             let located_id_att = false;
            //             let in_tag = false;

            //             for (let [i, t] of tokens.entries()) {
            //                 if (t.type == "meta.tag.punctuation.tag-open.xml"){

            //                     in_tag = true;
                                
            //                     this.shadowTags.push({
            //                         "tag" : tokens[i+1].value,
            //                         "row" : row,
            //                         "token_no" : i
            //                     });
                                
            //                 }
            //                 else if (t.type == "entity.other.attribute-name.xml"
            //                          && t.value.replace(/['"]/g, "") == "xml:id") {
            //                     located_id_att = true;                                
            //                 }
            //                 else if (t.type == "string.attribute-value.xml" && located_id_att) {
            //                     located_id_att = false;
            //                     // set id to xml:id                                
            //                     this.shadowTags[this.shadowTags.length-1].id = t.value.replace(/['"]/g, "");
            //                 }
            //                 else if (t.type == "meta.tag.punctuation.tag-close.xml"){
            //                     in_tag = false;
            //                     // if no id has been assigned, pick one from the generated list
            //                     let last_st = this.shadowTags[this.shadowTags.length-1];
            //                     if (!last_st.id){
            //                         last_st.id = this.gen_ids_clone.shift();
            //                     }
            //                 }
            //             }                        
            //         }
            //         // Reconsider whether this is really a component...
            //         new XPointerComponent({
            //             "el": this.el,
            //             "editor": editor,
            //             "shadowTags": this.shadowTags, 
            //             "shadowDOM": this.xmlDOM
            //         });
            //     }
                
            // });

        });

        return this.$el;
    }

    remove(e) {
        if (e) e.preventDefault();
        this.$el.empty();
        this.$el.remove();
        
        this.model.destroy();
    }

}

export default XMLFileView;