import $ from 'jquery';
import * as Backbone from 'backbone';
import Events from '../utils/backbone-events';
import loadScript from '../utils/load-script';
import xmlfile_tpl from '../templates/xmlfile-tpl';
import XPointerComponent from '../components/xpointer';

/**
 * Class representing interactions with an XML file
 * @extends Backbone.View
 */
class XMLFileView extends Backbone.View {
    /**
     * Get the class name
     * @returns The class name
     */
    get className() {
        return "cb-XMLFile";
    }

    /**
     * Manage events
     * @returns Event hashing that associates events to methods in the view
     */
    events() {
        return {
            'click .cb-xf-close': 'remove',
            'click .cb-xf-empty': 'toggleEmpty',
            'click .cb-xf-xpointer': 'toggleXPointer',
            'click .cb-xf-xp-cancel': 'cancelXPointerEntry',
            'click .cb-xf-xp-ok': 'addXPointerEntry',
            'click .btn-secondary': 'toggleFileType',
            'click .cb-xf-title.row': 'removePopUps',
            'click .span': 'addPointer'
        };
    }

    /**
     * Initialize the view
     * @param options - The options attached directly to the view.
     */
    initialize(options) {
        this.listenTo(Events, "XMLFile:resize", this.resize)
        this.xpointerOn = false;
        // This is temporary until I introduce a XPointer mode / button
        this.xmlDOM = (new DOMParser()).parseFromString(this.model.get("content"), "text/xml");
        // Create an array of new ids
        this.gen_ids = [];
        this.gen_ids_clone = [];
        this.shadowTags = [];
        // Add missing xml:ids to the shadow dom.
        for (let no_id of $(this.xmlDOM).find("*:not([xml\\:id])")) {
            var random_id = ("0000" + (Math.random() * Math.pow(36, 4) << 0).toString(36)).slice(-6);
            random_id = "cb_" + random_id;
            this.gen_ids.push(random_id);
            this.gen_ids_clone.push(random_id);
            no_id.setAttribute("xml:id", random_id);
        }
    }

    /**
     * Resize the XML file
     * @param size - The size
     */
    resize(size) {

        this.model.size = size;

        this.$el.removeClass(function (i, css) {
            return (css.match(/(^|\s)col-\S+/g) || []).join(' ');
        });
        this.$el.addClass('col-xs-' + size);

        if (this.editor) {
            this.editor.resize()
        }

    }

    /**
     * Bind the element selected by the user
     */
    bindElementSelect() {
        $(this.editor.container).click((e) => {
            e.stopPropagation();

            // Remove any element selectors
            this.$el.find(".cb-el_select").remove();
            this.$el.find(".cb-el_select_lemma").remove();

            let pos = this.editor.getCursorPosition();
            let token = this.editor.session.getTokenAt(pos.row, pos.column);
            let tokenRow = this.editor.session.getTokens(pos.row);
            let xmlid = "";

            if (token) {
                if (token.type == "entity.other.attribute-name.xml" && token.value == 'xml:id') {
                    for (let tk of tokenRow.slice(token.index)) {
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
            if (xmlid) {
                let find_q = "*[xml\\:id=" + xmlid + "]";
                let xmlel = $(this.xmlDOM).find(find_q);

                let tagName = xmlel.prop("tagName");
                let popup = $('<button type="button" class="btn btn-default cb-el_select">Add element: ' + tagName + '</button>');
                let popupLemma = $('<button type="button" class="btn btn-default cb-el_select_lemma">Create lemma: lem</button>');

                let parentOffset = this.$el.parent().offset();
                let offset = this.$el.offset();

                popup.css({
                    'position': 'absolute',
                    'left': e.pageX - offset.left,
                    'top': e.pageY - parentOffset.top,
                    'z-index': 999
                });

                this.$el.append(popup);

                popup.click((ePopup) => {
                    ePopup.stopPropagation();
                    Events.trigger("coreEntry:addPointer",
                        {
                            'xml_file': this.model.get("filename"),
                            'cb_xml_file_model': this.model.cid,
                            'ident': tagName,
                            'xmlid': xmlid,
                            'pos': pos,
                            'lemma': false
                        });
                    popup.remove();
                    popupLemma.remove();
                });

                if (this.model.get("lemma")) {
                    popupLemma.css({
                        'position': 'absolute',
                        'left': e.pageX - offset.left,
                        'top': e.pageY - parentOffset.top + popup[0].offsetHeight,
                        'z-index': 999
                    });

                    this.$el.append(popupLemma);

                    popupLemma.click((ePopupLemma) => {
                        ePopupLemma.stopPropagation();
                        Events.trigger("coreEntry:addPointer",
                            {
                                'xml_file': this.model.get("filename"),
                                'cb_xml_file_model': this.model.cid,
                                'ident': tagName,
                                'xmlid': xmlid,
                                'pos': pos,
                                'lemma': true
                            });
                        popup.remove();
                        popupLemma.remove();
                    });
                }
            }
        });
    }

    /**
     * Suspend the selection of the element by the user
     */
    suspendElementSelect() {
        $(this.editor.container).off('click');
    }

    /**
     * Render the XML file
     * @returns The XML file
     */
    render() {
        this.$el.addClass('col-xs-' + this.model.size);

        this.$el.append(xmlfile_tpl(this.model.toJSON()));

        // const ed_cnt = this.el;
        const ed_cnt = this.$el.find(".cb-ace").get(0);

        // TODO: Determine here if XML?
        // TODO: need to parametrize ace URL somehow, or make generally more reliable
        loadScript("dist/js/libs/ace/ace.js", { scriptTag: true }).then(() => {
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
                editor.getSession().insert({ column: 0, row: 0 }, this.model.get("content"));
                editor.moveCursorTo({ column: 0, row: 0 });
            });

            this.editor = editor;
            this.bindElementSelect();

            var listened = false;
            editor.getSession().on("changeAnnotation", () => {
                if (!listened && this.xpointerOn) {
                    listened = true;
                    var rows = editor.session.getDocument().getLength();
                    rows = Array.from(new Array(rows), (x, i) => i);

                    // Use a SAX parser approach to build a table of tags with ids corresponding to the shadow DOM
                    for (let row of rows) {
                        let tokens = editor.session.getTokens(row);

                        let located_id_att = false;
                        let in_tag = false;

                        for (let [i, t] of tokens.entries()) {
                            if (t.type == "meta.tag.punctuation.tag-open.xml") {

                                in_tag = true;

                                this.shadowTags.push({
                                    "tag": tokens[i + 1].value,
                                    "row": row,
                                    "token_no": i + 1
                                });

                            }
                            else if (t.type == "entity.other.attribute-name.xml"
                                && t.value.replace(/['"]/g, "") == "xml:id") {
                                located_id_att = true;
                            }
                            else if (t.type == "string.attribute-value.xml" && located_id_att) {
                                located_id_att = false;
                                // set id to xml:id                                
                                this.shadowTags[this.shadowTags.length - 1].id = t.value.replace(/['"]/g, "");
                            }
                            else if (t.type == "meta.tag.punctuation.tag-close.xml") {
                                in_tag = false;
                                // if no id has been assigned, pick one from the generated list
                                let last_st = this.shadowTags[this.shadowTags.length - 1];
                                if (!last_st.id) {
                                    last_st.id = this.gen_ids_clone.shift();
                                }
                            }
                        }
                    }
                    // TODO: Reconsider whether this is really a component...
                    this.XPointerComponent = new XPointerComponent({
                        "el": this.el,
                        "editor": editor,
                        "shadowTags": this.shadowTags,
                        "shadowDOM": this.xmlDOM
                    });

                    // move the cursor to position 1,1 to guarantee focus.
                    let sel = editor.getSession().getSelection()
                    sel.selectionLead.setPosition(1, 1);
                    sel.selectionAnchor.setPosition(1, 1);
                }

            });

        });

        return this.$el;
    }

    /**
     * Toggle the mode allowing to select elements and the mode not allowing to select elements
     */
    toggleEmpty() {

        // Remove any element selectors
        this.$el.find(".cb-el_select").remove();
        this.$el.find(".cb-el_select_lemma").remove();

        let btn = this.$el.find(".cb-xf-empty");
        let active = "cb-active";

        if (!btn.data(active)) {
            btn.data(active, true);
            this.suspendElementSelect();

            let ptr = {
                'xml_file': this.model.get("filename"),
                'cb_xml_file_model': this.model.cid,
                'empty': true
            }

            Events.trigger("coreEntry:addPointer", ptr);

            btn.data("cb-ptrdata", ptr);

        }
        else {
            btn.data(active, false);
            this.bindElementSelect();
            Events.trigger("coreEntry:removePointer", btn.data("cb-ptrdata"));
        }


    }

    /**
     * Add an expression in the XML file
     */
    addXPointerEntry() {

        if (this.XPointerComponent.xpointerdata) {
            // add a pointer to core entry
            Events.trigger("coreEntry:addPointer",
                {
                    'xml_file': this.model.get("filename"),
                    'cb_xml_file_model': this.model.cid,
                    'xpointer': this.XPointerComponent.xpointerdata
                });
            this.cancelXPointerEntry();
        }
        else {
            // this.$el.find(".cb-xf-xp-msg").text("Error.");
        }

    }

    /**
     * Switch to the mode that does not allow you to create expressions in the input XML file
     */
    cancelXPointerEntry() {
        this.$el.find(".cb-xf-xpointer").removeClass('active');
        this.toggleXPointer();
    }

    /**
     * Toggle between the mode allowing to create expressions in the XML file and the one not allowing it
     */
    toggleXPointer() {

        // Remove any element selectors
        this.$el.find(".cb-el_select").remove();
        this.$el.find(".cb-el_select_lemma").remove();

        let btn = this.$el.find(".cb-xf-xpointer");
        let active = "cb-active";

        if (btn.data(active) == null || btn.data(active) == undefined) {
            // first time
            btn.data(active, true);
            this.xpointerOn = true;

            // Turn off element selection
            this.suspendElementSelect();

            // Show selection drawer
            this.$el.find(".cb-xf-xp-drawer").show();

            // Hack to get ACE to respond. TODO: better solutions likely possible!
            this.editor.getSession().setAnnotations([]);
        }
        else if (!btn.data(active)) {
            btn.data(active, true);
            this.xpointerOn = true;

            // Turn off element selection
            this.suspendElementSelect();

            // Show selection drawer
            this.$el.find(".cb-xf-xp-drawer").show();

            // This event will do nothing if the component hasn't been initialized
            this.XPointerComponent.trigger("resume");

        }
        else {
            btn.data(active, false);
            this.xpointerOn = false;

            // Turn on element selection
            this.bindElementSelect();

            // Hide selection drawer
            this.$el.find(".cb-xf-xp-drawer").hide();

            this.XPointerComponent.trigger("suspend");
        }

    }

    /**
     * Remove a XML file
     * @param e - The event
     */
    remove(e) {
        if (e) e.preventDefault();
        this.$el.empty();
        this.$el.remove();

        this.model.destroy();
    }

    /**
     * Toggle the type of view of the file
     */
    toggleFileType() {
        let content = this.model.get("content"),
            title = "<title>",
            startTag = 'xml:id="',
            fromIndex = 0,
            HTML = "<h1>"

        HTML += content.substring(content.indexOf(title) + title.length, content.indexOf("</title>")) + "</h1>"
        content = content.substring(this.model.get("content").indexOf("<text>"))

        while (content.indexOf(startTag, fromIndex) != -1) {
            let endTag = "</" + content.substring(0, content.indexOf(startTag, fromIndex)).substring(content.substring(0, content.indexOf(startTag, fromIndex)).lastIndexOf('<') + 1).replaceAll(' ', '').replaceAll(`
`, '') + '>',
                tag = content.substring(content.indexOf(startTag, fromIndex), content.indexOf(endTag, fromIndex))

            let xmlID = content.substring(fromIndex).substring(content.substring(fromIndex).indexOf(startTag) + startTag.length)
            HTML += '<span id="' + xmlID.substring(0, xmlID.indexOf('"')) + '" class="span">' + tag.substring(tag.indexOf('>') + 1)

            fromIndex = content.indexOf(endTag, fromIndex) + endTag.length
            HTML += "</span>" + content.substring(fromIndex).substring(0, content.substring(fromIndex).indexOf('<'))
        }

        if (!this.$el[0].children[2]) {
            let newChild = document.createElement("div")
            newChild.innerHTML = HTML
            this.$el[0].children[1].parentNode.insertBefore(newChild, this.$el[0].children[1].nextSibling)
            this.$el[0].children[2].style.height = this.$el[0].children[1].offsetHeight + "px"
            this.$el[0].children[2].style.overflow = "auto"
            this.$el[0].children[2].style.background = "white"
            this.$el[0].children[2].style.textAlign = "justify"
            this.$el[0].children[2].style.fontFamily = "roman, 'times new roman', times, serif"
        }

        let filename = this.$el[0].children[0].children[0].children[0].innerText
        if (this.$el[0].children[0].children[0].children[1].children[1].innerText == "HTML") {
            this.$el[0].children[0].children[0].children[0].innerText = filename.substring(0, filename.lastIndexOf('.')) + ".html"
            this.$el[0].children[0].children[0].children[1].children[1].innerText = "XML"
            for (let i = 0; i < 2; i++)
                this.$el[0].children[0].children[1].children[i].style.display = "none"
            this.$el[0].children[1].style.display = "none"
            this.$el[0].children[2].style.display = "block"
        }
        else {
            this.$el[0].children[0].children[0].children[0].innerText = filename.substring(0, filename.lastIndexOf('.')) + ".xml"
            this.$el[0].children[0].children[0].children[1].children[1].innerText = "HTML"
            for (let i = 0; i < 2; i++)
                this.$el[0].children[0].children[1].children[i].style.display = "block"
            this.$el[0].children[1].style.display = "block"
            this.$el[0].children[2].style.display = "none"
        }
    }

    /**
     * Remove pop-ups
     */
    removePopUps() {
        this.$el.find(".cb-el_select").remove();
        this.$el.find(".cb-el_select_lemma").remove();
    }

    /**
     * Add a pointer to the core entry
     * @param event - The event
     */
    addPointer(event) {
        this.removePopUps()

        let popup = $('<button type="button" class="btn btn-default cb-el_select">Add element: ' + event.currentTarget.innerText + '</button>');
        let popupLemma = $('<button type="button" class="btn btn-default cb-el_select_lemma">Create lemma: lem</button>');

        let parentOffset = this.$el.parent().offset();
        let offset = this.$el.offset();

        popup.css({
            'position': 'absolute',
            'left': event.pageX - offset.left,
            'top': event.pageY - parentOffset.top,
            'z-index': 999
        });

        this.$el.append(popup);

        popup.click((ePopup) => {
            ePopup.stopPropagation();
            Events.trigger("coreEntry:addPointer",
                {
                    'xml_file': this.model.get("filename"),
                    'cb_xml_file_model': this.model.cid,
                    'xmlid': event.currentTarget.id,
                    'lemma': false
                })
            popup.remove();
            popupLemma.remove();
        });

        if (this.model.get("lemma")) {
            popupLemma.css({
                'position': 'absolute',
                'left': event.pageX - offset.left,
                'top': event.pageY - parentOffset.top + popup[0].offsetHeight,
                'z-index': 999
            });

            this.$el.append(popupLemma);

            popupLemma.click((ePopupLemma) => {
                ePopupLemma.stopPropagation();
                Events.trigger("coreEntry:addPointer",
                    {
                        'xml_file': this.model.get("filename"),
                        'cb_xml_file_model': this.model.cid,
                        'xmlid': event.currentTarget.id,
                        'lemma': true
                    })
                popup.remove();
                popupLemma.remove();
            });
        }
    }
}

export default XMLFileView;