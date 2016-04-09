import * as Backbone from 'backbone';
import XMLFiles from '../data/coll-XMLFiles';
import XMLFilesView from './XMLFiles-view';
import FileUploadComponent from '../components/fileupload';
import Events from '../utils/backbone-events.js';

// Sadly Bootstrap js is not ES6 ready yet.
var $ = global.jQuery = require('jquery');
require('../../../node_modules/bootstrap/dist/js/umd/modal');
require('../../../node_modules/bootstrap/dist/js/umd/tab');

class CoreBuilder extends Backbone.View {

	events() {
        return {
            'click #brand > a' : 'toggleSidebar',
            'click #add_files' : 'openFileUploadComponent',
            'click #arrange' : 'toggle_arrange',
            'click #arr_pick_size > span' : "arrange"
        };
    }

    initialize(options) {
        // Files
        var xmlFiles = this.xmlFiles = new XMLFiles;
        this.xmlFilesView = new XMLFilesView({collection: xmlFiles, el: "#workspace"});

        this.listenTo(Events, 'addFile', this.addFile);

    }

    addFile(textData){
        this.xmlFiles.add({"title": "Some title", "content": textData.content, "filename": textData.filename});
    }

    toggleSidebar(e) {
        e.preventDefault();
        $("#wrapper").toggleClass("toggled");
        $("#sidebar-wrapper").toggleClass("compact")
    }
    
    openFileUploadComponent(e){
        e.preventDefault();        
        new FileUploadComponent({"target" : this.$el});
    }

    toggle_arrange(e){
        e.preventDefault();
        $("#arr_pick_size").toggle();
    }

    arrange(e){
        e.preventDefault();
        let pos = 6 - $(e.target).index();
        this.xmlFilesView.arrange(pos);
    }

}

export default CoreBuilder;