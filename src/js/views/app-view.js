import * as Backbone from 'backbone';
import XMLFiles from '../data/coll-XMLFiles';
import XMLFilesView from './XMLFiles-view';
import Core from '../data/coll-Core';
import CurrentEntryView from './CurrentEntry-view';
import ElementSet from '../data/model-ElementSet';
import FileUploadComponent from '../components/fileupload';
import SetElementsComponent from '../components/setelements';
import ViewCoreComponent from '../components/viewcore';
import Events from '../utils/backbone-events.js';

// Sadly Bootstrap js is not ES6 ready yet.
var $ = global.jQuery = require('jquery');
require('../../../node_modules/bootstrap/dist/js/umd/modal');
require('../../../node_modules/bootstrap/dist/js/umd/tab');
require('../../../node_modules/bootstrap/dist/js/umd/tab');

class CoreBuilder extends Backbone.View {

    events() {
        return {
            'click #brand > a': 'toggleSidebar',
            'click #add_files > a': 'openFileUploadComponent',
            'click #set_els > a': 'openSetElementsComponent',
            'click #arrange': 'toggle_arrange',
            'click #arr_pick_size > span': "arrange",
            "click #view_core > a": "openViewCoreComponent",
            "click #openExampleFiles": "openExampleFiles"
        };
    }

    initialize(options) {
        // Files
        var xmlFiles = this.xmlFiles = new XMLFiles;
        this.xmlFilesView = new XMLFilesView({ collection: xmlFiles, el: "#workspace" });
        this.listenTo(Events, 'addFile', (textData, lemma) => {
            this.xmlFiles.add({ "title": "Some title", "content": textData.content, "filename": textData.filename, "lemma": lemma });
        });

        // Stand-off element set
        this.elementSet = new ElementSet;

        // Core
        this.core = new Core;
        // Always start the core with one unsaved entry
        this.core.add({});
        this.listenTo(Events, "coreEntry:addPointer", function (p) { this.core.addPointer(p) });
        this.listenTo(Events, "coreEntry:removePointer", function (p) { this.core.removePointer(p) });

        // Current Entry
        this.newCurrentEntryView();

        // When a new core entry is added, render it.
        this.listenTo(this.core, "add", this.newCurrentEntryView);

    }

    newCurrentEntryView() {
        var currententry = new CurrentEntryView({
            model: { lastCore: this.core.last(), target: this.$el },
            "el": "#currententry",
            "elementSet": this.elementSet,
            "collection": this.core
        });
        this.listenTo(this.elementSet, "change", () => { currententry.updateElementSet(this.elementSet) });
    }

    toggleSidebar(e) {
        e.preventDefault();
        $("#wrapper").toggleClass("toggled");
        $("#sidebar-wrapper").toggleClass("compact");
    }

    openFileUploadComponent(e) {
        e.preventDefault();
        new FileUploadComponent({ "target": this.$el, "collection": this.core, "model": this.elementSet });
    }

    openSetElementsComponent(e) {
        e.preventDefault();
        new SetElementsComponent({ "target": this.$el, "model": this.elementSet });
    }

    openViewCoreComponent(e) {
        e.preventDefault();
        new ViewCoreComponent({ "target": this.$el, "collection": this.core });
    }

    openExampleFiles(e) {
        e.preventDefault();
        $.get("example_data/E2.xml", function (text) {
            let textdata = { "filename": "E2.xml", "url": "example_data/E2.xml", "content": text }
            Events.trigger("addFile", textdata)
        }, 'text')
        $.get("example_data/S71.xml", function (text) {
            let textdata = { "filename": "S71.xml", "url": "example_data/S71.xml", "content": text }
            Events.trigger("addFile", textdata)
        }, 'text')
        $.get("example_data/Trm0319a-Canto.xml", function (text) {
            let textdata = { "filename": "Trm0319a-Canto.xml", "url": "example_data/Trm0319a-Canto.xml", "content": text }
            Events.trigger("addFile", textdata)
        }, 'text')
    }

    toggle_arrange(e) {
        e.preventDefault();
        $("#arr_pick_size").toggle();
    }

    arrange(e) {
        e.preventDefault();
        let pos = 6 - $(e.target).index();
        this.xmlFilesView.arrange(pos);
    }

}

export default CoreBuilder;