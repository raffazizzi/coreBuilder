import * as Backbone from 'backbone';
import currententry_tpl from '../templates/currententry-tpl';
import currententrydata_tpl from '../templates/currententrydata-tpl';
import Prism from 'prismjs';
import vk from 'vkbeautify';

var $ = global.jQuery = require('jquery');
require("../../../node_modules/bootstrap/dist/js/umd/button.js");

class CurrentEntryView extends Backbone.View {

    initialize(options) {
        this.elementSet = options.elementSet;
        this.listenTo(this.model, 'change', this.renderData);
        this.listenTo(this.model.pointers, 'add', this.renderData);
        this.render();
    }

    events(){
        return {
            "click #cb-ce-xml" : ()=>{this.toggleXMLView()},
            "click .cb-ce-ctrls-del" : (e)=>{
                this.removeEntryPart($(e.target).data("targets").split(","));
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
                this.destroy();
            }
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
        if (targets[0] == "all") {
            this.model.pointers.reset();
        }
        else {
            for (let target of targets) {

                let targetParts = target.split("#");

                let pointers = this.model.pointers.filter(function(pointer){
                    return pointer.get("xml_file") == targetParts[0] &&
                           pointer.get("xmlid") == targetParts[1]
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

        let parser = new DOMParser();
        let xmlDoc = parser.parseFromString("<"+data.wrapper.name+"/>","text/xml");
        let wrapper = xmlDoc.documentElement;

        let _createElementDown = (lvl, xmlel) => {
            for (let cnt of lvl.content) {
                let el = xmlDoc.createElement(cnt.name);
                if (cnt.targets) {
                    for (let target of cnt.targets) {
                        el.setAttribute("target", cnt.targets.join(" "));
                    }
                }                
                if (cnt.content) {
                    _createElementDown(cnt, el);
                }
                xmlel.appendChild(el);
            }    
        }

        _createElementDown(data.wrapper, wrapper);

        return xmlDoc;
    }

    render() {

        this.$el.html(currententry_tpl());
        this.renderData();

        return this;
    }

    renderData() {
        let data = {};
        if (this.model.pointers.models.length > 0){

            this.showEntry();
            
            let es = this.elementSet;
            let ptr_bhv = this.elementSet["ptr_bhv"];

            let wrapper = {"name": es.wrapper, "content": []};
            var cnt = null;
            if (es.container) {
                cnt = {"name": es.container, "content": [], "_targets": []};
            }
            
            let pointers = [];
            if (ptr_bhv == "attr") {
                let ptr = {"name": es.ptr};
                let targets = [];
                for (let pointer of this.model.pointers.models) {
                    let xp = pointer.get("xmlid") ? pointer.get("xmlid") : pointer.get("xpointer"); 
                    targets.push(pointer.get("xml_file") + "#" + xp);
                }
                ptr.targets = targets;
                if (cnt) {
                    cnt.content.push(ptr);
                    cnt._targets = cnt._targets.concat(targets);
                    wrapper.content.push(cnt);
                }
                else {
                    wrapper.content.push(ptr);
                }
            }
            else if (ptr_bhv == "el") {
                for (let pointer of this.model.pointers.models) {
                    let ptr = {"name": es.ptr};
                    let xp = pointer.get("xmlid") ? pointer.get("xmlid") : pointer.get("xpointer");
                    ptr.targets = [pointer.get("xml_file") + "#" + xp];
                    if (cnt) {
                        cnt.content.push(ptr);
                        cnt._targets = cnt._targets = cnt._targets.concat(ptr.targets);
                    }
                    else {
                        wrapper.content.push(ptr);
                    }
                }
                if (cnt) {
                    wrapper.content.push(cnt);
                }
            }
            else if (ptr_bhv == "cnt"){
                let byfile = this.model.pointers.groupBy(function(pointer){
                    return pointer.get("xml_file")
                });
                for (var key of Object.keys(byfile)) {

                    let cnt = {"name": es.container, "content": [], "_targets": []};
                    for (let pointer of byfile[key]) {
                        let ptr = {"name": es.ptr};
                        let xp = pointer.get("xmlid") ? pointer.get("xmlid") : pointer.get("xpointer");
                        ptr.targets = [pointer.get("xml_file") + "#" + xp];
                        cnt.content.push(ptr);
                        cnt._targets = cnt._targets.concat(ptr.targets);
                    }
                    wrapper.content.push(cnt);
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

        }
        else this.hideEntry();
        
    }

    showEntry() {
        this.$el.find("#cb-ce-entry").show();
        this.$el.find("#cb-ce-msg").hide();
    }

    hideEntry() {
        this.$el.find("#cb-ce-entry").hide();
        this.$el.find("#cb-ce-msg").show();
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