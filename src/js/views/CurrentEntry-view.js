import * as Backbone from 'backbone';
import currententry_tpl from '../templates/currententry-tpl';
import currententrydata_tpl from '../templates/currententrydata-tpl';
import currententrygrps_tpl from '../templates/currententrygrps-tpl';
import Prism from 'prismjs';
import vk from 'vkbeautify';

var $ = global.jQuery = require('jquery');
require("../../../node_modules/bootstrap/dist/js/umd/button.js");

class CurrentEntryView extends Backbone.View {

    initialize(options) {
        this.elementSet = options.elementSet;
        this.listenTo(this.model, 'change', this.renderData);
        this.listenTo(this.model.pointers, 'add', this.renderData);
        this.listenTo(this.model.pointers, 'remove', ()=>{
            if (this.model.pointers.length > 0){
                this.renderData();
            }
            else this.render();
        });

        this.render();
    }

    events(){
        return {
            "click #cb-ce-xml" : ()=>{this.toggleXMLView()},
            "click .cb-ce-ctrls-del" : (e)=>{
                this.removeEntryPart($(e.target).parent().data("targets"));
            },
            "click #cb-ce-cancel" : ()=>{this.removeEntryPart(["all"])},
            "click #cb-ce-minimize" : ()=>{
                if (this.$el.hasClass("cb-ce-minimized")){
                    this.$el.removeClass("cb-ce-minimized");
                }
                else {
                    this.$el.addClass("cb-ce-minimized");
                }
            },
            "click #cb-ce-add" : ()=>{
                this.model.saveToCore();
                this.removeEntryPart(["all"])
                this.undelegateEvents();
            },
            "click #cb-ce-g-new": "newGroup",
            "click .cb-ce-g": "selectGroup",
            "click .cb-ce-g-el": "addToGroup"
        }
    }

    updateElementSet(elset){
        // Make sure this entry is not already saved
        if (!this.model.get("saved")){
            this.elementSet = elset;
            this.renderData();
        }        
    }

    removeEntryPart(targets) {
        if (targets == "all") {
            this.model.pointers.reset();
            this.model.groups.reset();
        }
        else {
            targets = Array.isArray(targets) ? targets : [targets];
            for (let target of targets) {
                
                let pointers = this.model.pointers.filter(function(pointer){
                    return pointer.cid == target
                });

                for (let ptr of pointers) {
                    ptr.destroy();
                }
            }
        }

        if (this.model.pointers.length > 0){
            this.renderData();
        }
        else this.render();

    }

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
        let xmlDoc = parser.parseFromString("<"+data.wrapper.name+"/>","text/xml");
        let wrapper = xmlDoc.documentElement;

        let currentXMLFile = this.model.pointers.first().get("xml_file");

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

    newGroup() {
        let pos = this.model.groups.length + 1;
        this.unselectGroups(); 
        this.model.groups.add({"number" : pos, "selected": true});
        this.renderGroupDropdown();
    }

    selectGroup(e) {
        let pos = parseInt($(e.target).data("pos")) - 1;
        this.unselectGroups();
        this.model.groups.models[pos].set("selected", true);
        this.renderGroupDropdown();
    }

    unselectGroups(){
        this.model.groups.each(function(g){
            g.set("selected", false);
        });
    }

    addToGroup(e) {
        let targets = $(e.target).parent().data("targets");

        for (let target of targets) {

            let targetParts = target.split("#");

            for (let ptr of this.model.pointers.models) {
                if (targets.indexOf(ptr.cid) > -1) {
                    let group = this.model.groups.filter(function(group){
                        return group.get("selected");
                    });
                    if (group.length > 0) { 
                        ptr.set("group", group[0].get("number"));
                    }
                }                
            }
        }

        this.renderData();
        
    }

    renderGroupDropdown() { 
        this.$el.find("#cb-ce-g-dd").html(currententrygrps_tpl(this.model.groups.toJSON()));
    }

    render() {

        this.$el.html(currententry_tpl());
        this.renderGroupDropdown();
        this.renderData();

        return this;
    }

    renderData() {

        let data = {};
        if (this.model.pointers.models.length > 0){

            this.showEntry();
            
            let es = this.elementSet;
            let ptr_bhv = this.elementSet.get("ptr_bhv");

            let el_wrapper = es.get("wrapper");
            let el_grp = es.get("grp");
            let el_grp_name = el_grp.get("name");
            let el_container = es.get("container");
            let el_ptr = es.get("ptr");

            let wrapper = {"name": el_wrapper.get("name"), "content": [], 'xmlatts': el_wrapper.xmlatts.toJSON()};
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
                let ptr = {"name": el_ptr.get("name"), 'xmlatts': el_ptr.xmlatts.toJSON()};
                let targets = [];
                let _targets = [];
                for (let pointer of this.model.pointers.models) {
                    if (!pointer.get("empty")) {
                        let xp = pointer.get("xmlid") ? pointer.get("xmlid") : pointer.get("xpointer"); 
                        targets.push({"xmlid" : pointer.get("xml_file") + "#" + xp, "cid" : pointer.cid});
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

                for (let pointer of this.model.pointers.models) {
                    if (!pointer.get("empty")) {
                        let ptr = {"name": el_ptr.get("name"), 'xmlatts': el_ptr.xmlatts.toJSON()};
                        let xp = pointer.get("xmlid") ? pointer.get("xmlid") : pointer.get("xpointer");
                        ptr.targets = [{"xmlid" : pointer.get("xml_file") + "#" + xp, "cid" : pointer.cid}];
                        ptr._targets = '["'+pointer.cid+'"]';

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
                                    "name" : el_grp_name,
                                    "number" : grp_no,
                                    "content" : [],
                                    "_targets" : [pointer.cid],
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
            else if (ptr_bhv == "cnt"){
                let byfile = this.model.pointers.groupBy(function(pointer){
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
                    let inGroup = false;
                    for (let pointer of byfile[key]) {
                       if (!pointer.get("empty")) {
                            let ptr = {"name": el_ptr.get("name"), 'xmlatts': el_ptr.xmlatts.toJSON()};
                            let xp = pointer.get("xmlid") ? pointer.get("xmlid") : pointer.get("xpointer");
                            ptr.targets = [{"xmlid" : pointer.get("xml_file") + "#" + xp, "cid" : pointer.cid}];
                            ptr._targets = '["'+pointer.cid+'"]';
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
                                        "name" : el_grp_name,
                                        "number" : grp_no,
                                        "content" : [],
                                        "_targets" : cnt._targets,
                                        "xmlatts": el_grp.xmlatts.toJSON()
                                    };
                                    grp.content.push(cnt);
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

            data.wrapper = wrapper;
            data.xml = new XMLSerializer().serializeToString(this.getXML(data));
            data.xml = vk.xml(data.xml);

            // custom formatting fix
            data.xml = this.fixXMLindent(data.xml);

            this.model.set("xml", data.xml);
            this.model.set("json", wrapper);

            this.$el.find("#cb-ce-entry-body").html(currententrydata_tpl(data));

            // If the current view is set to XML, switch to it
            if (this.$el.find("#cb-ce-xml").hasClass("active")){
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

    showEntry() {
        this.$el.find("#cb-ce-entry").show();
    }

    hideEntry() {
        this.$el.find("#cb-ce-entry").hide();
    }

    toggleXMLView() {
        this.$el.find("#cb-ce-entry-xml").toggle();
        this.$el.find("#cb-ce-entry-items").toggle();
        Prism.highlightAll();
    }

    fixXMLindent(xml){
        // TODO make better
        return xml.replace(/(#[^#]+)\s/g, "$1\n");
    }

    destroy(){
        this.undelegateEvents();
        this.$el.removeData().unbind(); 
    }

}

export default CurrentEntryView;