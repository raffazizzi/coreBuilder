import * as Backbone from 'backbone';
import loadfile_tpl from '../templates/loadfile-tpl';
import Events from '../utils/backbone-events.js';

// Sadly Bootstrap js is not ES6 ready yet.
var $ = global.jQuery = require('jquery');
require('../../../node_modules/bootstrap/dist/js/umd/modal');
require('../../../node_modules/bootstrap/dist/js/umd/tab');

/**
 * Class representing interactions when importing files
 * @extends Backbone.View
 */
class FileUploadComponent extends Backbone.View {

    /**
     * Initialize the view
     * @param options - The options attached directly to the view.
     */
    initialize(options) {

        this.target = options.target;
        this.files = null;
        this.core = null;
        this.$el = $(loadfile_tpl);

        let $status = this.$el.find('#cb-lf-status');
        let progress = this.$el.find('.cb-lf-progress > progress')
        let lemma = false

        if (this.model["attributes"]["container"]["attributes"]["name"] != "rdg") {
            this.$el.find('#checkbox-lemma').attr("hidden", "")
            this.$el.find('#lbl-lemma').attr("hidden", "")
        }

        // Events
        this.$el.on('change', '#btn-files :file', (e) => {
            $status.empty();
            let input = $(e.target)
            this.files = input.get(0).files;
            this.showFilesNumber();
        });

        this.$el.on('change', '#btn-core :file', (e) => {
            $status.empty();
            let input = $(e.target)
            this.core = input.get(0).files;
            this.showCoreNumber();
            if (this.core.length) {
                let filePromise = (new _FileReader(this.core[0], progress, $status)).select()

                this.$el.find('#checkbox-lemma').attr("hidden", "")
                this.$el.find('#lbl-lemma').attr("hidden", "")

                filePromise.then(
                    (textdata) => {
                        textdata.content = textdata.content.replaceAll("standoff", "standOff")
                        if ((new DOMParser).parseFromString(textdata.content, "application/xml").querySelectorAll("standOff")[0].innerHTML.search("<lem") < 0)
                            lemma = false
                        else
                            lemma = true
                    })
                    .catch(
                        function () {
                            $status.text("Error reading file :(");
                        });
            } else {
                this.$el.find('#checkbox-lemma').removeAttr("hidden")
                this.$el.find('#lbl-lemma').removeAttr("hidden")
            }
        });

        this.$el.on('dragover', '#cb-lf-drop-files', (e) => {
            e.stopPropagation();
            e.preventDefault();
            e.originalEvent.dataTransfer.dropEffect = 'copy';
        });

        this.$el.on('dragover', '#cb-lf-drop-core', (e) => {
            e.stopPropagation();
            e.preventDefault();
            e.originalEvent.dataTransfer.dropEffect = 'copy';
        });

        this.$el.on('drop', '#cb-lf-drop-files', (e) => {
            $status.empty();
            e.stopPropagation();
            e.preventDefault();
            this.files = e.originalEvent.dataTransfer.files;
            this.showFilesNumber();
        });

        this.$el.on('drop', '#cb-lf-drop-core', (e) => {
            $status.empty();
            e.stopPropagation();
            e.preventDefault();
            this.core = e.originalEvent.dataTransfer.files;
            this.showCoreNumber();
        });

        // Resets on tab change.
        this.$el.find("a[data-toggle='tab']").on('show.bs.tab', function () {
            $status.empty();
        });

        this.$el.on('click', '#cb-lf-open', (e) => {
            e.preventDefault();

            // Determine which tab is open
            if (this.$el.find("#cb-lf-upload").hasClass("active")) {
                let xmlFiles = true
                if (this.files && this.files.length >= 2) {
                    for (i = 0; i < this.files.length; i++)
                        // Only process XML files.
                        if (this.files[i].name.split('.').pop() != "xml") {
                            xmlFiles = false
                            break
                        }
                } else
                    xmlFiles = false

                if (!xmlFiles || this.core && this.core.length > 1 || this.core && this.core[0].name.split('.').pop() != "xml")
                    $status.text("Please select two or more XML files and a maximum of one core in XML format.");
                else {
                    // FileList is a strange object...
                    for (var i = 0, f; f = this.files[i]; i++) {
                        let filePromise = (new _FileReader(f, progress, $status)).select();

                        filePromise.then(
                            (textdata) => {
                                Events.trigger('addFile', textdata, lemma);
                                // Last file?
                                if (i == Object.keys(this.files).length) {
                                    this.$el.modal('hide').data('bs.modal', null);
                                }
                            })
                            .catch(
                                function (reason) {
                                    console.log(reason);
                                    $status.text("Error reading file :(");
                                });
                    }

                    if (this.core) {
                        let filePromise = (new _FileReader(this.core[0], progress, $status)).select()

                        filePromise.then(
                            (textdata) => {
                                textdata.content = textdata.content.replaceAll("standoff", "standOff")
                                let childNodes = (new DOMParser).parseFromString(textdata.content, "application/xml").querySelectorAll("standOff")[0].childNodes
                                let elementNode = false

                                childNodes.forEach(childNode => {
                                    if (childNode.nodeType == Node.ELEMENT_NODE)
                                        elementNode = true
                                })

                                if (elementNode) {
                                    this.collection.pop()

                                    childNodes.forEach(childNode => {
                                        if (childNode.nodeType == Node.ELEMENT_NODE) {
                                            let standOffTags = (childNode.outerHTML.substring(0, childNode.outerHTML.indexOf(' ')) + childNode.outerHTML.substring(childNode.outerHTML.indexOf('>'), childNode.outerHTML.length)).split('\n')

                                            let standOffTag = standOffTags[0] + '\n'
                                            for (i = 1; i < standOffTags.length; i++)
                                                standOffTag += standOffTags[i].substring(standOffTags[standOffTags.length - 1].indexOf('<'), standOffTags[i].length) + '\n'

                                            this.collection.add({ "saved": true, "xml": standOffTag })
                                        }
                                    })

                                    this.collection.add({ "saved": false })
                                }
                            })
                            .catch(
                                function () {
                                    $status.text("Error reading file :(");
                                });
                    }
                }
            } else if (this.$el.find("#cb-lf-web").hasClass("active")) {
                let url = this.$el.find('#cb-fl-web-input').val();
                if (url != "") {
                    // Try to get file
                    $.ajax({
                        url: url,
                        success: (data, status, xhr) => {
                            let filename = url.split("/").slice(-1);
                            let textdata = { "filename": filename[0], "url": url, "content": xhr.responseText };
                            Events.trigger('addFile', textdata);
                            this.$el.modal('hide').data('bs.modal', null);
                        },
                        error: function (err) { $status.text("Could not load file!") },
                        dataType: 'xml'
                    });
                }
                else $status.text("Please enter an address");
            }
        });

        this.render();

        this.$el.on('click', '#checkbox-lemma', () => {
            if (this.$el.find("#checkbox-lemma").attr("checked")) {
                lemma = false
                this.$el.find("#checkbox-lemma").removeAttr("checked")
            }
            else {
                lemma = true
                this.$el.find("#checkbox-lemma").attr("checked", "")
            }
        })
    }

    /**
     * Show the number of imported files
     */
    showFilesNumber() {
        let numFiles = this.files ? this.files.length : 1;
        this.$el.find("#cb-lf-filesselected").text(numFiles + " files selected");
        this.$el.trigger("cb-fl-chosen");
    }

    /**
     * Show information indicating that the core has been imported
     */
    showCoreNumber() {
        let numFiles = this.core ? this.core.length : 1;
        if (numFiles)
            this.$el.find("#cb-lf-coreselected").text(numFiles + " core selected");
        else
            this.$el.find("#cb-lf-coreselected").text("")
        this.$el.trigger("cb-fl-chosen");
    }

    /**
     * Show the modal window
     */
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

/**
 * Class representing the reading of a file
 */
class _FileReader {
    /**
     * Create a _FileReader object
     * @param file - The file to read
     * @param progress - The file loading progress bar
     * @param status - The status of the imported file
     */
    constructor(file, progress, status) {
        this.$progress = progress;
        this.$status = status;
        this.file = file;
        this.reader = new FileReader();
        this.text = "";
    }

    /**
     * Abort the reading of the file
     */
    abortRead() {
        this.reader.abort();
    }

    /**
     * Manage errors
     * @param e - The event
     */
    errorHandler(e) {
        switch (e.target.error.code) {
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

    /**
     * Update the progress bar
     * @param e - The event
     */
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

    /**
     * Select a file
     * @returns A Promise object
     */
    select() {
        // Reset progress indicator on new file selection.
        this.$progress.attr('value', 0);
        this.$progress.text('0%');

        this.reader.onerror = this.errorHandler;
        this.reader.onprogress = this.updateProgress;
        this.reader.onabort = function (e) {
            this.$status.html("File read cancelled");
        };
        this.reader.onloadstart = (e) => {
            this.$progress.show();
        };
        this.reader.onload = (e) => {
            // Ensure that the progress bar displays 100% at the end.
            this.$progress.attr('value', 100);
            this.$progress.text('100%');
            setTimeout(() => { this.$progress.hide() }, 2000);
            this.text = e.target.result;
            this.$progress.trigger("cb-fl-load-done");
        }
        // Read in the file as text and return a promise
        return new Promise((resolve, reject) => {
            this.reader.readAsText(this.file);
            this.$progress.on('cb-fl-load-done', () => {
                // TODO: Unclear why this fires one extra time with empty text.
                if (this.text != "") {
                    var textdata = { "filename": this.file.name, "content": this.text };
                    resolve(textdata);
                }
            });
        });
    }

}

export default FileUploadComponent;