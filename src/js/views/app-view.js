import * as Backbone from 'backbone';
import XMLFiles from '../data/coll-XMLFiles';
import XMLFilesView from './XMLFiles-view';
import Core from '../data/coll-Core';
import CoreView from "./Core-view"
import CurrentEntryView from './CurrentEntry-view';
import ElementSet from '../data/model-ElementSet';
import FileUploadComponent from '../components/fileupload';
import SetElementsComponent from '../components/setelements';
import Events from '../utils/backbone-events.js';
import loadScript from "../utils/load-script"

// Sadly Bootstrap js is not ES6 ready yet.
var $ = global.jQuery = require('jquery');
require('../../../node_modules/bootstrap/dist/js/umd/modal');
require('../../../node_modules/bootstrap/dist/js/umd/tab');
require('../../../node_modules/bootstrap/dist/js/umd/tab');

/**
 * Class representing the main interactions with the user of the application
 * @extends Backbone.View
 */
class CoreBuilder extends Backbone.View {
    /**
     * Manage events
     * @returns Event hashing that associates events to methods in the view
     */
    events() {
        return {
            'click #brand > a': 'toggleSidebar',
            'click #add_files > a': 'openFileUploadComponent',
            'click #set_els > a': 'openSetElementsComponent',
            'click #arrange': 'toggle_arrange',
            'click #arr_pick_size > span': "arrange",
            "click #openExampleFiles": "openExampleFiles"
        };
    }

    /**
     * Initialize the view
     * @param options - The options attached directly to the view.
     */
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
        this.coreView = new CoreView({ collection: [this.core, xmlFiles], el: "#workspace" })
        // Always start the core with one unsaved entry
        this.core.add({});
        this.listenTo(Events, "coreEntry:addPointer", function (p) { this.core.addPointer(p) });
        this.listenTo(Events, "coreEntry:removePointer", function (p) { this.core.removePointer(p) });

        // Current Entry
        this.newCurrentEntryView();

        // When a new core entry is added, render it.
        this.listenTo(this.core, "add", this.newCurrentEntryView);

    }

    /**
     * Add a current entry view
     */
    newCurrentEntryView() {
        var currententry = new CurrentEntryView({
            model: { lastCore: this.core.last(), target: this.$el },
            "el": "#currententry",
            "elementSet": this.elementSet,
            "collection": this.core
        });
        this.listenTo(this.elementSet, "change", () => { currententry.updateElementSet(this.elementSet) });
    }

    /**
     * Toggle the sidebar
     * @param e - Event
     */
    toggleSidebar(e) {
        e.preventDefault();
        $("#wrapper").toggleClass("toggled");
        $("#sidebar-wrapper").toggleClass("compact");
    }

    /**
     * Open the pop-up to manage interactions when importing files
     * @param e - Event
     */
    openFileUploadComponent(e) {
        e.preventDefault();
        new FileUploadComponent({ "target": this.$el, "collection": this.core, "model": this.elementSet });
    }

    /**
     * Open the pop-up window to manage interactions when defining stand-off markup elements
     * @param e - Event
     */
    openSetElementsComponent(e) {
        e.preventDefault();
        new SetElementsComponent({ "target": this.$el, "model": this.elementSet });
    }

    /**
     * Open example XML files
     * @param e - Event
     */
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

    /**
     * Detect the layout of the windows containing the XML files chosen by the user
     * @param e - Event
     */
    toggle_arrange(e) {
        e.preventDefault();
        $("#arr_pick_size").toggle();
    }

    /**
     * Switch the layout of the windows containing the input XML files according to the choice made by the user
     * @param e - Event
     */
    arrange(e) {
        e.preventDefault();
        let pos = 6 - $(e.target).index();

        const edCnt = this.$el.find("#core .cb-ace").get(0);

        loadScript("dist/js/libs/ace/ace.js", { scriptTag: true }).then(() => {
            var editor;
            ace.require(['ace/ace'], (loadedAce) => {
                editor = loadedAce.edit(edCnt);

                let XML = ""
                for (let i = 0; i < editor.getSession().getLength(); i++)
                    XML += editor.getSession().getLine(i) + '\n'

                this.xmlFilesView.arrange(pos, XML)
            });
        });
    }

}

export default CoreBuilder;