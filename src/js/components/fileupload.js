import * as Backbone from 'backbone';
import loadfile_tpl from '../templates/loadfile-tpl';
import Events from '../utils/backbone-events.js';

// Sadly Bootstrap js is not ES6 ready yet.
var $ = global.jQuery = require('jquery');
require('../../../node_modules/bootstrap/dist/js/umd/modal');
require('../../../node_modules/bootstrap/dist/js/umd/tab');

class FileUploadComponent extends Backbone.View {

    // Components are model-less views
    
    initialize(options){

        this.target = options.target;
        this.files = null;
        this.$el = $(loadfile_tpl);

        // Events
        this.$el.on('change', '.btn-file :file', (e) => {
            let input = $(e.target)
            this.files = input.get(0).files;
            this.showFilesNumber();
        });

        this.$el.on('dragover', '#cb-lf-drop', (e) => {
            e.stopPropagation();
            e.preventDefault();
            e.originalEvent.dataTransfer.dropEffect = 'copy';
        });

        this.$el.on('drop', '#cb-lf-drop', (e) => {
            e.stopPropagation();
            e.preventDefault();            
            this.files = e.originalEvent.dataTransfer.files;
            this.showFilesNumber();            
        });

        this.$el.on('cb-fl-chosen', function () {
            $(this).find("#cb-lf-open").removeClass("disabled");
        });

        this.$el.on('click', '#cb-lf-open', (e) => {
            e.preventDefault();
            if (this.files){
                let progress = this.$el.find('.cb-lf-progress > progress'),
                    status = this.$el.find('.modal-body');
                // FileList is a strange object...
                for (var i = 0, f; f = this.files[i]; i++) {
                    // Only process text files.
                    if (!f.type.match('text.*')) {
                        status.text("Wrong file type - try with an XML file");
                        continue;
                    }

                    let filePromise = (new _FileReader(f, progress, status)).select();

                    filePromise.then(
                        (textdata) => {                            
                            Events.trigger('addFile', textdata);
                            // Last file?
                            if (i == Object.keys(this.files).length) {
                                this.$el.modal( 'hide' ).data( 'bs.modal', null );
                            }
                    })
                    .catch(
                        function(reason) {
                            console.log(reason);
                            status.text("Error reading file :(");
                    });

                }
            }
        });

        this.render();

    }

    showFilesNumber() {
        let numFiles = this.files ? this.files.length : 1;
        this.$el.find("#cb-lf-filesselected").text(numFiles + " files selected");
        this.$el.trigger("cb-fl-chosen");
    }

    render() {
        
        $(this.target).append(this.$el);

        this.$el.modal('show');

        if (window.File && window.FileReader && window.FileList && window.Blob) {
            // noop
        } else {
            // not tested
            this.$el.find('.modal-body').html("File upload not supported in your browser :(");
            return 0;
        }

    }

}

class _FileReader {
    constructor(file, progress, status){
        this.$progress = progress;
        this.$status = status;
        this.file = file;
        this.reader = new FileReader();
        this.text = "";
    }

    abortRead() {
        this.reader.abort();
    }

    errorHandler(e) {
        switch(e.target.error.code) {
          case e.target.error.NOT_FOUND_ERR:
            alert('File Not Found!');
            break;
          case e.target.error.NOT_READABLE_ERR:
            alert('File is not readable');
            break;
          case e.target.error.ABORT_ERR:
            break; // noop
          default:
            console.log('An error occurred reading this file.');
            // not tested
            this.$status.html("Error reading file :(");
        };
    }

    updateProgress(e) {
        // e is an ProgressEvent.
        if (e.lengthComputable) {
          var percentLoaded = Math.round((e.loaded / e.total) * 100);
          // Increase the progress bar length.
          if (percentLoaded < 100) {
            this.$progress.attr('value', percentLoaded);
            this.$progress.text(percentLoaded + '%');
          }
        }
    }

    select() {
        // Reset progress indicator on new file selection.
        this.$progress.attr('value', 0);
        this.$progress.text('0%');

        this.reader.onerror = this.errorHandler;
        this.reader.onprogress = this.updateProgress;
        this.reader.onabort = function(e) {
          this.$status.html("File read cancelled");
        };
        this.reader.onloadstart = (e) => {
          this.$progress.show();
        };
        this.reader.onload = (e) => {
          // Ensure that the progress bar displays 100% at the end.
          this.$progress.attr('value', 100);
          this.$progress.text('100%');
          setTimeout(()=>{this.$progress.hide()}, 2000);
          this.text = e.target.result;
          this.$progress.trigger("cb-fl-load-done");
        }
        // Read in the file as text and return a promise
        return new Promise((resolve, reject)=>{
            this.reader.readAsText(this.file);
            this.$progress.on('cb-fl-load-done', () => {
                // TODO: Unclear why this fires one extra time with empty text.
                if (this.text != "") {
                    var textdata = {"filename": this.file.name, "content" : this.text};
                    resolve(textdata);
                }
            });
        });
    }

}

export default FileUploadComponent;