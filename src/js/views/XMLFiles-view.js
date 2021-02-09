import $ from 'jquery';
import * as Backbone from 'backbone';
import XMLFileView from './XMLFile-view.js';
import Events from '../utils/backbone-events.js';
import core_tpl from "../templates/core-tpl"
import xmlfile_tpl from "../templates/xmlfile-tpl"
import loadScript from "../utils/load-script"
import coreXML_tpl from "../templates/coreXML-tpl"

/**
 * Class representing XML files
 * @extends Backbone.View
 */
class XMLFilesView extends Backbone.View {
    /**
     * Initialize the view
     */
    initialize() {
        this.listenTo(this.collection, 'add', this.addOne);
        this.listenTo(this.collection, 'remove', () => {
            //noop
        });
    }

    /**
     * Add a XML file
     * @param m - The XML file
     */
    addOne(m) {
        // update model cell size if needed
        if (this.cell_size) {
            m.size = this.cell_size;
        }
        this.$el.append(new XMLFileView({ model: m }).render());
        this.arrange();
    }

    /**
     * Arrange the layout of XML files
     * @param cols - The columns
     * @param XML - The XML data
     */
    arrange(cols, XML) {
        if (!cols) {
            if (this.cols) {
                cols = this.cols;
            }
            else {
                cols = 1;
            }
        }
        this.cols = cols;
        let cell_size = this.cell_size = Math.floor(12 / parseInt(cols));
        // Events.trigger("XMLFiles:resize", cell_size);
        // Re-organize divs in multiple rows
        let xfiles = this.$el.find('.cb-XMLFile');
        xfiles.detach();

        this.$el.empty();

        Events.trigger("XMLFile:resize", cell_size);

        var rows = [];
        while (xfiles.length) {
            rows.push(xfiles.splice(0, cols));
        }

        // create needed number of rows and re-attach xfiles
        let divFiles = $("<div>").attr("id", "files")
        for (let row of rows) {
            let div = $('<div>').addClass("row");
            for (let xfile of row) {
                if (xfile.classList[1])
                    div.append(xfile);
            }
            if (div[0].innerHTML)
                divFiles.append(div)
        }

        this.$el.append($("<div>").attr("id", "filesCore").append(divFiles).append($("<div>").attr("id", "core").html(core_tpl())))
        this.$el.find("#core .cb-XMLFile").html(xmlfile_tpl())

        const edCnt = this.$el.find("#core .cb-ace").get(0);

        loadScript("dist/js/libs/ace/ace.js", { scriptTag: true }).then(() => {
            var editor;
            ace.require(['ace/ace'], (loadedAce) => {
                editor = loadedAce.edit(edCnt);

                editor.setTheme("ace/theme/chrome");
                editor.setShowPrintMargin(false);
                editor.getSession().setMode("ace/mode/xml");
                editor.$blockScrolling = Infinity;
                editor.$enableBlockSelect = false;
                editor.$enableMultiselect = false;
                if (XML == undefined)
                    editor.getSession().insert({ column: 0, row: 0 }, coreXML_tpl())
                else
                    editor.getSession().insert({ column: 0, row: 0 }, XML)
                editor.moveCursorTo({ column: 0, row: 0 });
            });
        });

        this.$el.find("#core .cb-ace").height(this.$el.find("#files").height() - this.$el.find("#coreHeader").height())
    }
}

export default XMLFilesView;