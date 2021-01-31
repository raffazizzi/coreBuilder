import * as Backbone from 'backbone';
import coreentries_tpl from '../templates/coreentries-tpl';
import coreXML_tpl from '../templates/coreXML-tpl';
import Prism from 'prismjs';
import saveAs from 'save-as';

// Sadly Bootstrap js is not ES6 ready yet.
var $ = global.jQuery = require('jquery');
require('bootstrap/dist/js/umd/modal');

class CoreView extends Backbone.View {

    initialize() {
        this.listenTo(this.collection, "add", this.renderLastEntry)
    }

    events() {
        return {
            "click .cb-vc-remove": "removeOne",
            "click #cb-vc-download": "download"
        }
    }

    removeOne(e) {
        let m_id = this.$(e.target).closest("div").data("entry");
        this.collection.remove(m_id);
        this.renderEntries();
    }

    download() {

        let xml_string = "";

        this.collection.each((entry, i) => {
            if (entry.get("saved")) {
                xml_string += entry.get("xml");
            }
        });

        xml_string = coreXML_tpl(xml_string);

        let bb = new Blob([xml_string], { "type": "text\/xml" });
        saveAs(bb, 'core.xml');
    }

    renderLastEntry() {
        if (this.collection.models.length > 1)
            this.$el.find("#coreEntries").append(coreentries_tpl([{ id: this.collection.models[this.collection.models.length - 2].cid, xml: this.collection.toJSON()[this.collection.toJSON().length - 2].xml }]))

        Prism.highlightAll()
    }

    renderEntries() {
        let coreData = []

        this.collection.each((entry, i) => {
            // skip last entry (considered "not saved") 
            // and any other leaked unsaved entries... TODO (fix this)
            if (entry.get("saved")) {
                coreData.push({
                    "id": entry.cid,
                    "xml": entry.get("xml")
                });
            }
        });

        this.$el.find("#coreEntries").html(coreentries_tpl(coreData));

        Prism.highlightAll();
    }

}

export default CoreView;