import * as Backbone from 'backbone';
import saveAs from 'save-as';
import loadScript from "../utils/load-script"

// Sadly Bootstrap js is not ES6 ready yet.
var $ = global.jQuery = require('jquery');
require('bootstrap/dist/js/umd/modal');

class CoreView extends Backbone.View {

    initialize() {
        this.listenTo(this.collection, "add", this.renderLastEntry)
    }

    events() {
        return {
            "click #cb-vc-download": "download"
        }
    }

    download() {
        const edCnt = this.$el.find("#core .cb-ace").get(0);

        loadScript("dist/js/libs/ace/ace.js", { scriptTag: true }).then(() => {
            var editor;
            ace.require(['ace/ace'], (loadedAce) => {
                editor = loadedAce.edit(edCnt);

                let XML = ""
                for (let i = 0; i < editor.getSession().getLength(); i++)
                    XML += editor.getSession().getLine(i) + '\n'

                saveAs(new Blob([XML], { "type": "text\/xml" }), 'core.xml');
            });
        });
    }

    renderLastEntry() {
        if (this.collection.toJSON()[this.collection.toJSON().length - 2]) {
            const edCnt = this.$el.find("#core .cb-ace").get(0);

            loadScript("dist/js/libs/ace/ace.js", { scriptTag: true }).then(() => {
                var editor;
                ace.require(['ace/ace'], (loadedAce) => {
                    editor = loadedAce.edit(edCnt);

                    for (let i = 0; i < editor.getSession().getLength(); i++)
                        if (editor.getSession().getLine(i).includes("</standoff>")) {
                            let splitedXML = this.collection.toJSON()[this.collection.toJSON().length - 2].xml.split('\n'), XML = ""
                            for (let j = 0; j < splitedXML.length; j++) {
                                XML += '\t'
                                if (j)
                                    XML += '\t'
                                XML += splitedXML[j] + '\n'
                            }

                            editor.getSession().insert({ column: editor.getSession().getLine(i).indexOf("</standoff>"), row: i }, XML + '\t');
                            break
                        }
                });
            });
        }
    }

}

export default CoreView;