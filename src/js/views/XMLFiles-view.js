import $ from 'jquery';
import * as Backbone from 'backbone';
import XMLFileView from './XMLFile-view.js';
import Events from '../utils/backbone-events.js';
import core_tpl from "../templates/core-tpl"

class XMLFilesView extends Backbone.View {

    initialize() {
        this.listenTo(this.collection, 'add', this.addOne);
        this.listenTo(this.collection, 'remove', () => {
            //noop
        });
    }

    addOne(m) {
        // update model cell size if needed
        if (this.cell_size) {
            m.size = this.cell_size;
        }
        this.$el.append(new XMLFileView({ model: m }).render());
        this.arrange();
    }

    arrange(cols) {
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
                div.append(xfile);
            }
            divFiles.append(div)
        }

        this.$el.append($("<div>").attr("id", "filesCore").append(divFiles).append($("<div>").attr("id", "core").html(core_tpl())))
    }
}

export default XMLFilesView;