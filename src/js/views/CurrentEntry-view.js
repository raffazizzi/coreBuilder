import * as Backbone from 'backbone';
import currententry_tpl from '../templates/currententry-tpl';
import currententrydata_tpl from '../templates/currententrydata-tpl';
import currententrygrps_tpl from '../templates/currententrygrps-tpl';
import Prism from 'prismjs';
import vk from 'vkbeautify';
import TextualVariationsComponent from '../components/TextualVariationsComponent';

var $ = global.jQuery = require('jquery');
require("../../../node_modules/bootstrap/dist/js/umd/button.js");

/**
 * Class representing interactions with the current entry window
 * @extends Backbone.View
 */
class CurrentEntryView extends Backbone.View {
    /**
     * Initialize the view
     * @param options - The options attached directly to the view.
     */
    initialize(options) {
        this.elementSet = options.elementSet;
        this.reading = "rdg"
        this.listenTo(this.model.lastCore, 'change', this.renderData);
        this.listenTo(this.model.lastCore.pointers, 'add', this.renderData);
        this.listenTo(this.model.lastCore.pointers, 'remove', () => {
            if (this.model.lastCore.pointers.length > 0) {
                this.renderData();
            }
            else this.render();
        });

        this.render();
    }

    /**
     * Manage events
     * @returns Event hashing that associates events to methods in the view
     */
    events() {
        return {
            "click #cb-ce-xml": () => { this.toggleXMLView() },
            "click .cb-ce-ctrls-del": (e) => {
                this.removeEntryPart($(e.target).parent().data("targets"));
            },
            "click #cb-ce-cancel": () => { this.removeEntryPart(["all"]) },
            "click #cb-ce-minimize": () => {
                if (this.$el.hasClass("cb-ce-minimized")) {
                    this.$el.removeClass("cb-ce-minimized");
                }
                else {
                    this.$el.addClass("cb-ce-minimized");
                }
            },
            "click #cb-ce-add": () => {
                this.model.lastCore.saveToCore();

                // Add new entry to core
                if (this.collection.at(this.collection.length - 1).get("xml"))
                    this.collection.add({ "saved": false })

                this.removeEntryPart(["all"])
                this.undelegateEvents();
            },
            "click #cb-ce-g-new": "newGroup",
            "click .cb-ce-g": "selectGroup",
            "click .cb-ce-g-el": "addToGroup"
        }
    }

    /**
     * Update the current entry if stand-off markup elements are modified
     * @param elset - Stand-off markup elements
     */
    updateElementSet(elset) {
        // Make sure this entry is not already saved
        if (!this.model.lastCore.get("saved")) {
            this.elementSet = elset;
            this.renderData();
        }
    }

    /**
     * Remove an entry part
     * @param targets - The targets
     */
    removeEntryPart(targets) {
        if (targets == "all") {
            this.model.lastCore.pointers.reset();
            this.model.lastCore.groups.reset();
        }
        else {
            targets = Array.isArray(targets) ? targets : [targets];
            for (let target of targets) {

                let pointers = this.model.lastCore.pointers.filter(function (pointer) {
                    return pointer.cid == target
                });

                for (let ptr of pointers) {
                    ptr.destroy();
                }
            }
        }

        if (this.model.lastCore.pointers.length > 0) {
            this.renderData();
        }
        else this.render();

    }

    /**
     * Transform data into XML format
     * @param data - The data
     * @returns Data in XML format
     */
    getXML(data) {

        var _writeattribute = (el, a) => {
            let value = a.value;

            let partFileName = currentXMLFile.substring(0, currentXMLFile.lastIndexOf("."));
            value = value.replace(/%filename/g, partFileName);
            value = value.replace(/%egg/g, "🐰");

            // Deal with special attribute values
            el.setAttribute(a.name, value);
        }

        let parser = new DOMParser();
        let xmlDoc = parser.parseFromString("<" + data.wrapper.name + "/>", "text/xml");
        let wrapper = xmlDoc.documentElement;

        let currentXMLFile = this.model.lastCore.pointers.first().get("xml_file");

        // Add wrapper's attributes
        for (let a of data.wrapper.xmlatts) {
            if (a.name && !a.isTarget) {
                _writeattribute(wrapper, a);
            }
        }

        let _createElementDown = (lvl, xmlel) => {
            for (let cnt of lvl.content) {
                if (cnt.name) {
                    let el = xmlDoc.createElement(cnt.name);
                    let target_att = "target";
                    for (let a of cnt.xmlatts) {
                        if (a.name && !a.isTarget) {
                            _writeattribute(el, a);
                        }
                        if (a.isTarget) {
                            target_att = a.name;
                        }
                    }
                    if (cnt.targets) {
                        let ids = [];
                        for (let target of cnt.targets) {
                            ids.push(target.xmlid);
                        }
                        el.setAttribute(target_att, ids.join(" "));
                    }
                    if (cnt.content) {
                        _createElementDown(cnt, el);
                    }
                    xmlel.appendChild(el);
                }
            }
        }

        _createElementDown(data.wrapper, wrapper);

        return xmlDoc;
    }

    /**
     * Create a group
     */
    newGroup() {
        let pos = this.model.lastCore.groups.length + 1;
        this.unselectGroups();
        this.model.lastCore.groups.add({ "number": pos, "selected": true });
        this.renderGroupDropdown();
    }

    /**
     * Select a group
     * @param e - Event
     */
    selectGroup(e) {
        let pos = parseInt($(e.target).data("pos")) - 1;
        this.unselectGroups();
        this.model.lastCore.groups.models[pos].set("selected", true);
        this.renderGroupDropdown();
    }

    /**
     * Unselect all groups 
     */
    unselectGroups() {
        this.model.lastCore.groups.each(function (g) {
            g.set("selected", false);
        });
    }

    /**
     * Add textual variations
     * @returns The textual variations
     */
    addVariations() {
        let variations = ["spelling", "semantic", "ponctuation", "omission", "repetition"]

        for (let i = 0; i < this.collection.toJSON().length; i++)
            if (this.collection.toJSON()[i].json)
                for (let j = 0; j < this.collection.toJSON()[i].json.content.length; j++) {
                    if (this.collection.toJSON()[i].json.content[j].name == this.elementSet.get("container").get("name") && this.collection.toJSON()[i].json.content[j].xmlatts[1])
                        variations.push(this.collection.toJSON()[i].json.content[j].xmlatts[1].value)
                    if (this.collection.toJSON()[i].json.content[j].name == this.elementSet.get("grp").get("name") && this.collection.toJSON()[i].json.content[j].xmlatts[0])
                        variations.push(this.collection.toJSON()[i].json.content[j].xmlatts[0].value)
                }

        for (let i = 0; i < this.model.lastCore.toJSON().json.content.length; i++) {
            if (this.model.lastCore.toJSON().json.content[i].name == this.elementSet.get("container").get("name") && this.model.lastCore.toJSON().json.content[i].xmlatts[1])
                variations.push(this.model.lastCore.toJSON().json.content[i].xmlatts[1].value)
            if (this.model.lastCore.toJSON().json.content[i].name == this.elementSet.get("grp").get("name") && this.model.lastCore.toJSON().json.content[i].xmlatts[0])
                variations.push(this.model.lastCore.toJSON().json.content[i].xmlatts[0].value)
        }

        return Array.from(new Set(variations))
    }

    /**
     * Add an element to the group
     * @param e - Event
     */
    addToGroup(e) {
        let targets = $(e.target).parent().data("targets");

        for (let target of targets) {

            let targetParts = target.split("#");

            for (let ptr of this.model.lastCore.pointers.models) {
                if (targets.indexOf(ptr.cid) > -1) {
                    let group = this.model.lastCore.groups.filter(function (selectedGroup) {
                        return selectedGroup.get("selected");
                    });
                    if (group.length > 0) {
                        ptr.set("group", group[0].get("number"));
                    }
                }
            }
        }

        this.renderData();

        if (!this.model.lastCore.toJSON().json.content[this.model.lastCore.toJSON().json.content.length - 1].xmlatts.length)
            new TextualVariationsComponent({ currentEntry: this, index: this.model.lastCore.toJSON().json.content.length - 1 })
    }

    /**
     * Render the group
     */
    renderGroupDropdown() {
        this.$el.find("#cb-ce-g-dd").html(currententrygrps_tpl(this.model.lastCore.groups.toJSON()));
    }

    /**
     * Render the current entry
     * @returns The current entry
     */
    render() {

        this.$el.html(currententry_tpl());
        this.renderGroupDropdown();
        this.renderData();

        return this;
    }

    /**
     * Render the data
     */
    renderData() {

        let data = {};
        if (this.model.lastCore.pointers.models.length > 0) {

            this.showEntry();

            let es = this.elementSet;
            let ptr_bhv = this.elementSet.get("ptr_bhv");

            let el_wrapper = es.get("wrapper");
            let el_grp = es.get("grp");
            let el_grp_name = el_grp.get("name");
            let el_container = es.get("container");
            let el_ptr = es.get("ptr");

            let wrapper = { "name": el_wrapper.get("name"), "content": [], 'xmlatts': el_wrapper.xmlatts.toJSON() };
            var cnt = null;
            if (el_container.get("name")) {
                cnt = {
                    "name": el_container.get("name"),
                    "content": [],
                    "targets": [],
                    "_targets": [],
                    "xmlatts": el_container.xmlatts.toJSON()
                };
            }

            let pointers = [];
            if (ptr_bhv == "attr") {
                // Remember: no need to worry about group elements in this behavior
                let ptr = { "name": el_ptr.get("name"), 'xmlatts': el_ptr.xmlatts.toJSON() };
                let targets = [];
                let _targets = [];
                for (let pointer of this.model.lastCore.pointers.models) {
                    if (!pointer.get("empty")) {
                        let xp = pointer.get("xmlid") ? pointer.get("xmlid") : pointer.get("xpointer");
                        targets.push({ "xmlid": pointer.get("xml_file") + "#" + xp, "cid": pointer.cid });
                        _targets.push(pointer.cid);
                    }
                }
                ptr.targets = targets;
                ptr._targets = JSON.stringify(_targets);
                if (cnt) {
                    cnt.content.push(ptr);
                    cnt._targets = JSON.stringify(cnt._targets.concat(_targets));
                    wrapper.content.push(cnt);
                }
                else {
                    wrapper.content.push(ptr);
                }
            }
            else if (ptr_bhv == "el") {

                var grps = {};
                var ptrs = [];
                let inGroup = false;

                for (let pointer of this.model.lastCore.pointers.models) {
                    if (!pointer.get("empty")) {
                        let ptr = { "name": el_ptr.get("name"), 'xmlatts': el_ptr.xmlatts.toJSON() };
                        let xp = pointer.get("xmlid") ? pointer.get("xmlid") : pointer.get("xpointer");
                        ptr.targets = [{ "xmlid": pointer.get("xml_file") + "#" + xp, "cid": pointer.cid }];
                        ptr._targets = '["' + pointer.cid + '"]';

                        if (cnt) {
                            cnt.content.push(ptr);
                            cnt.targets.push(pointer.cid);
                            cnt._targets = JSON.stringify(cnt.targets);
                        }

                        // deal with grouping
                        let grp_no = pointer.get("group");
                        if (grp_no && el_grp_name) {
                            inGroup = true;
                            if (grps[grp_no]) {
                                if (cnt) {
                                    grps[grp_no].content.push(cnt)
                                }
                                else {
                                    grps[grp_no].content.push(ptr)
                                }
                                grps[grp_no]._targets.push(pointer.cid)
                            }
                            else {
                                let grp = {
                                    "name": el_grp_name,
                                    "number": grp_no,
                                    "content": [],
                                    "_targets": [pointer.cid],
                                    "xmlatts": el_grp.xmlatts.toJSON()
                                };
                                if (cnt) {
                                    grp.content.push(cnt);
                                }
                                else {
                                    grp.content.push(ptr);
                                }
                                grps[grp_no] = grp;
                            }
                        }
                        else {
                            ptrs.push(ptr);
                        }

                    }
                }
                if (!inGroup) {
                    if (cnt) {
                        wrapper.content.push(cnt);
                    }
                    else {
                        wrapper.content = wrapper.content.concat(ptrs);
                    }
                }
                else {
                    for (let ptr of ptrs) {
                        wrapper.content.push(ptr);
                    }
                    for (let grp_no of Object.keys(grps).sort()) {
                        wrapper.content.push(grps[grp_no]);
                    }
                }

            }
            else if (ptr_bhv == "cnt") {
                let byfile = this.model.lastCore.pointers.groupBy(function (pointer) {
                    return pointer.get("xml_file")
                });

                var grps = {};

                for (var key of Object.keys(byfile)) {

                    let cnt = {
                        "name": el_container.get("name"),
                        "content": [],
                        "_targets": [],
                        'xmlatts': el_container.xmlatts.toJSON()
                    };

                    if (this.model.lastCore.toJSON().json)
                        for (let i = 0; i < this.model.lastCore.toJSON().json.content.length; i++)
                            if (this.model.lastCore.toJSON().json.content[i].name == this.reading && this.model.lastCore.toJSON().json.content[i].content[0].targets[0].xmlid.split('#')[0] == key) {
                                if (this.model.lastCore.toJSON().json.content[i].xmlatts[1])
                                    cnt.xmlatts.push({ name: this.model.lastCore.toJSON().json.content[i].xmlatts[1].name, value: this.model.lastCore.toJSON().json.content[i].xmlatts[1].value })
                                if (this.model.lastCore.toJSON().json.content[i].done)
                                    cnt.done = true
                            }

                    let inGroup = false;
                    for (let pointer of byfile[key]) {
                        if (!pointer.get("empty")) {
                            let ptr = { "name": el_ptr.get("name"), 'xmlatts': el_ptr.xmlatts.toJSON() };
                            let xp = pointer.get("xmlid") ? pointer.get("xmlid") : pointer.get("xpointer");
                            ptr.targets = [{ "xmlid": pointer.get("xml_file") + "#" + xp, "cid": pointer.cid }];
                            ptr._targets = '["' + pointer.cid + '"]';
                            cnt.content.push(ptr);
                            cnt._targets.push(pointer.cid);

                            let grp_no = pointer.get("group");
                            if (grp_no && el_grp_name) {
                                inGroup = true;
                                if (grps[grp_no]) {
                                    grps[grp_no].content.push(cnt)
                                    grps[grp_no]._targets.push(pointer.cid)
                                }
                                else {
                                    let grp = {
                                        "name": el_grp_name,
                                        "number": grp_no,
                                        "content": [],
                                        "_targets": cnt._targets,
                                        "xmlatts": el_grp.xmlatts.toJSON()
                                    };
                                    grp.content.push(cnt);

                                    for (let i = 0; i < this.model.lastCore.toJSON().json.content.length; i++)
                                        if (this.model.lastCore.toJSON().json.content[i].number == grp_no && this.model.lastCore.toJSON().json.content[i].xmlatts[0])
                                            grp.xmlatts.push({ name: this.model.lastCore.toJSON().json.content[i].xmlatts[0].name, value: this.model.lastCore.toJSON().json.content[i].xmlatts[0].value })

                                    grps[grp_no] = grp;
                                }
                            }

                        }
                    }
                    cnt._targets = JSON.stringify(cnt._targets);

                    if (!inGroup) {
                        wrapper.content.push(cnt);
                    }
                }

                for (let grp_no of Object.keys(grps).sort()) {
                    wrapper.content.push(grps[grp_no]);
                }
            }

            for (let i = this.model.lastCore.pointers.models.length - 1; i >= 0; i--)
                if (this.model.lastCore.pointers.models[i].toJSON().lemma) {
                    wrapper.content[i].name = "lem"
                    break
                }

            if (this.model.lastCore.toJSON().json)
                for (let i = 0; i < this.model.lastCore.toJSON().json.content.length; i++)
                    if (this.model.lastCore.toJSON().json.content[i].name == this.reading && !this.model.lastCore.toJSON().json.content[i].done) {
                        new TextualVariationsComponent({ currentEntry: this, index: this.model.lastCore.toJSON().json.content.length - 1 })
                        break
                    }

            data.wrapper = wrapper;
            data.xml = new XMLSerializer().serializeToString(this.getXML(data));
            data.xml = vk.xml(data.xml);

            // custom formatting fix
            data.xml = this.fixXMLindent(data.xml);

            this.model.lastCore.set("xml", data.xml);
            this.model.lastCore.set("json", wrapper);

            this.$el.find("#cb-ce-entry-body").html(currententrydata_tpl(data));

            // If the current view is set to XML, switch to it
            if (this.$el.find("#cb-ce-xml").hasClass("active")) {
                this.toggleXMLView();
            }

            // Show grouping components if a group element has been set.
            if (el_grp.get("name")) {
                this.$el.find(".cb-ce-g-el").show();
                this.$el.find("#cb-ce-entry-grps").show();
            }
            else {
                this.$el.find("#cb-ce-entry-grps").hide();
            }

        }
        else this.hideEntry();

    }

    /**
     * Show the entry
     */
    showEntry() {
        this.$el.find("#cb-ce-entry").show();
    }

    /**
     * Hide the entry
     */
    hideEntry() {
        this.$el.find("#cb-ce-entry").hide();
    }

    /**
     * Toggle between standard display and XML format display
     */
    toggleXMLView() {
        this.$el.find("#cb-ce-entry-xml").toggle();
        this.$el.find("#cb-ce-entry-items").toggle();
        Prism.highlightAll();
    }

    /**
     * Fix the indentation of XML data
     * @param xml - The XML data
     * @returns The XML data fixed
     */
    fixXMLindent(xml) {
        // TODO make better
        return xml.replace(/(#[^#]+)\s/g, "$1\n");
    }

    /**
     * Delete the current entry
     */
    destroy() {
        this.undelegateEvents();
        this.$el.removeData().unbind();
    }

}

export default CurrentEntryView;