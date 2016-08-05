import * as Backbone from 'backbone';
import viewcore_tpl from '../templates/viewcore-tpl';
import viewcoreentries_tpl from '../templates/viewcoreentries-tpl';
import coreXML_tpl from '../templates/coreXML-tpl';
import Prism from 'prismjs';
import saveAs from 'save-as';

// Sadly Bootstrap js is not ES6 ready yet.
var $ = global.jQuery = require('jquery');
require('../../../node_modules/bootstrap/dist/js/umd/modal');

class ViewCoreComponent extends Backbone.View {
    
    initialize(options){
        this.target = options.target;
        this.render();
    }

    events() {
        return {
            "click .cb-vc-remove" : "removeOne",
            "click #cb-vc-download" : "download"
        }
    }

    removeOne(e){
        let m_id = this.$(e.target).closest("div").data("entry");
        this.collection.remove(m_id);
        this.renderEntries();
    }

    download() {

        let xml_string = "";

        this.collection.each((entry, i)=>{
            if (entry.get("saved")){
                xml_string += entry.get("xml");
            }
        });

        xml_string = coreXML_tpl(xml_string);

        let bb = new Blob([xml_string], {"type":"text\/xml"});
        saveAs(bb, 'core.xml');

        this.$el.find("#cb-vc_modal").modal('hide');
    }

    renderEntries() {
        let coreData = []

        this.collection.each((entry, i)=>{
            // skip last entry (considered "not saved") 
            // and any other leaked unsaved entries... TODO (fix this)
            if (entry.get("saved")){
                coreData.push({
                    "id": entry.cid,
                    "xml": entry.get("xml")
                });
            }
        });

        this.$el.find(".modal-body").html(viewcoreentries_tpl(coreData));

        Prism.highlightAll();
    }

    render() {

        let component = $(viewcore_tpl());
        this.target.append(this.$el.append(component));
        component.modal('show');   

        this.renderEntries();     

    }

}

export default ViewCoreComponent;