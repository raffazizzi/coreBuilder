import $ from 'jquery';
import * as Backbone from 'backbone';
// import Events from '../utils/backbone-events';
import currententry_tpl from '../templates/currententry-tpl';

class CurrentEntryView extends Backbone.View {

    events() {
        return {
            
        };
    }

    initialize(options) {
        this.elementSet = options.elementSet;
        this.listenTo(this.model, 'change', this.render);
        this.listenTo(this.model.pointers, 'add', this.render);
        this.render();
    }

    updateElementSet(elset){
        this.elementSet = elset;
        this.render();
    }

    render() {

        let data = {};

        if (this.model.pointers.models.length > 0){
            let es = this.elementSet;
            let ptr_bhv = this.elementSet["ptr_bhv"];

            let parser = new DOMParser();
            let xmlDoc = parser.parseFromString("<"+es.wrapper+"/>","text/xml");

            let wrapper = xmlDoc.documentElement;
            
            let pointers = [];
            if (ptr_bhv == "attr") {
                let ptr = xmlDoc.createElement(es.ptr);
                let targets = [];
                for (let pointer of this.model.pointers.models) {
                    targets.push(pointer.get("xmlid"));
                }
                ptr.setAttribute("target", "#" + targets.join(" #"));
                pointers.push(ptr);
            }
            else if (ptr_bhv == "el") {
                for (let pointer of this.model.pointers.models) {
                    let ptr = xmlDoc.createElement(es.ptr);
                    ptr.setAttribute("target", "#" + pointer.get("xmlid"));
                    pointers.push(ptr);
                }
            }
            else {
                let byfile = this.model.pointers.groupBy(function(pointer){
                    return pointer.get("xml_file")
                });
                for (var key of Object.keys(byfile)) {
                    let ptr = xmlDoc.createElement(es.ptr);
                    let targets = [];
                    for (let pointer of byfile[key]) {
                        targets.push(pointer.get("xmlid"));
                    }
                    ptr.setAttribute("target", "#" + targets.join(" #"));
                    pointers.push(ptr);
                }
            }

            if (es.container) {
                let cnt = xmlDoc.createElement(es.container);
                for (let p of pointers){
                    cnt.appendChild(p);
                }
            }
            else {
                for (let p of pointers){
                    wrapper.appendChild(p);
                }
            }

            data.xml = new XMLSerializer().serializeToString(xmlDoc);
    
        }

        this.$el.html(currententry_tpl(data));
    }

}

export default CurrentEntryView;