import * as Backbone from 'backbone';
import saveAs from 'save-as';
import loadScript from "../utils/load-script"

// Sadly Bootstrap js is not ES6 ready yet.
var $ = global.jQuery = require('jquery');
require('bootstrap/dist/js/umd/modal');

class CoreView extends Backbone.View {

    initialize() {
        this.listenTo(this.collection[0], "add", this.renderLastEntry)
    }

    events() {
        return {
            "click #cb-vc-download": "download",
            "click #toggling": "toggle"
        }
    }

    download() {
        const edCnt = this.$el.find("#core .cb-ace").get(0)

        switch (this.$el.find("select")[0].options.selectedIndex) {
            case 0:
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

                break

            case 1:
                loadScript("dist/js/libs/ace/ace.js", { scriptTag: true }).then(() => {
                    var editor;
                    ace.require(['ace/ace'], (loadedAce) => {
                        editor = loadedAce.edit(edCnt);

                        let XML = ""
                        for (let i = 0; i < editor.getSession().getLength(); i++)
                            XML += editor.getSession().getLine(i)

                        let childNodes = (new DOMParser).parseFromString(XML, "application/xml").querySelectorAll("standoff")[0].childNodes
                        let elementNode = false

                        childNodes.forEach(childNode => {
                            if (childNode.nodeType == Node.ELEMENT_NODE)
                                elementNode = true
                        })

                        if (elementNode) {
                            for (let childNode of childNodes)
                                if (childNode.nodeType == Node.ELEMENT_NODE) {
                                    let filename

                                    if (!childNode.children[0].attributes[0])
                                        filename = childNode.children[0].children[0].attributes[0].value.substring(1) + ".xml"
                                    else if (childNode.children[0].attributes[0].value[0] == '#')
                                        filename = childNode.children[0].attributes[0].value.substring(1) + ".xml"
                                    else
                                        filename = childNode.children[0].attributes[0].value.substring(0, childNode.children[0].attributes[0].value.indexOf('#'))

                                    for (let XMLFile of this.collection[1].toJSON())
                                        if (XMLFile.filename == filename) {
                                            this.$el.find("#core").append($("<div>").attr("id", "XSLT").hide())
                                            this.$el.find("#core #XSLT").html("")

                                            $.get("out-test1.xsl", function (text) {
                                                let xsltProcessor = new XSLTProcessor()
                                                xsltProcessor.importStylesheet((new DOMParser).parseFromString(text, "application/xml"))
                                                document.getElementById("XSLT").appendChild(xsltProcessor.transformToFragment((new DOMParser).parseFromString(XMLFile.content, "application/xml"), document))

                                                saveAs(new Blob([document.getElementById("XSLT").innerHTML], { "type": "text\/html" }), 'core.html')
                                            }, "text")

                                            break
                                        }

                                    break
                                }
                        } else
                            alert("The core is not complete.")
                    });
                });
        }
    }

    showHTML() {
        this.$el.find("#core #HTML").html("")

        const edCnt = this.$el.find("#core .cb-ace").get(0);

        loadScript("dist/js/libs/ace/ace.js", { scriptTag: true }).then(() => {
            var editor;
            ace.require(['ace/ace'], (loadedAce) => {
                editor = loadedAce.edit(edCnt);

                let XML = ""
                for (let i = 0; i < editor.getSession().getLength(); i++)
                    XML += editor.getSession().getLine(i)

                let childNodes1 = (new DOMParser).parseFromString(XML, "application/xml").querySelectorAll("standoff")[0].childNodes
                let elementNode = false

                childNodes1.forEach(childNode1 => {
                    if (childNode1.nodeType == Node.ELEMENT_NODE)
                        elementNode = true
                })

                if (elementNode) {
                    childNodes1.forEach(childNode1 => {
                        if (childNode1.nodeType == Node.ELEMENT_NODE) {
                            let childNodes2 = ""

                            for (let childNode2 of childNode1.children) {
                                childNodes2 += "<p><table style='background-color: #FFFF00;'><tr><td>" + childNode2.nodeName

                                for (let attribute of childNode2.attributes)
                                    if (attribute.name == "type") {
                                        childNodes2 += ' "' + attribute.value + '"'
                                    }

                                childNodes2 += "</td></tr><tr><td>"

                                if (childNode1.nodeName != "app")
                                    childNodes2 += '"' + childNode2.attributes[0].value + '"'
                                else if (!childNode2.children[0].children.length)
                                    childNodes2 += '"' + childNode2.children[0].attributes[0].value + '"'
                                else {
                                    let childNodes3 = ""

                                    for (let childNode3 of childNode2.children) {
                                        childNodes3 += "<p><table style='background-color: #CCFFCC;'><tr><td>" + childNode3.nodeName

                                        for (let attribute of childNode3.attributes)
                                            if (attribute.name == "type") {
                                                childNodes3 += ' "' + attribute.value + '"'
                                            }

                                        childNodes3 += "</td></tr><tr><td>"

                                        if (!childNode3.children[0].children.length)
                                            childNodes3 += '"' + childNode3.children[0].attributes[0].value + '"'

                                        childNodes3 += "</td></tr></table></p>"
                                    }

                                    childNodes2 += childNodes3
                                }

                                childNodes2 += "</td></tr></table></p>"
                            }
                            this.$el.find("#core #HTML").append("<p><table style='background-color: #99CC00;'><tr><td>" + childNode1.nodeName + childNodes2 + "</td></tr></table></p>")
                        }
                    })
                }
            });
        });
    }

    toggle() {
        if (this.$el.find("#toggling span").text() == "XML") {
            this.$el.find("#toggling span").text("HTML")
            this.$el.find("#core .cb-XMLFile").show()
            this.$el.find("#core #HTML").hide()

            const edCnt = this.$el.find("#core .cb-ace").get(0);

            loadScript("dist/js/libs/ace/ace.js", { scriptTag: true }).then(() => {
                var editor;
                ace.require(['ace/ace'], (loadedAce) => {
                    editor = loadedAce.edit(edCnt);

                    editor.moveCursorTo({ column: 0, row: 0 });
                });
            });
        }
        else {
            this.$el.find("#toggling span").text("XML")
            this.$el.find("#core .cb-XMLFile").hide()
            if (!this.$el.find("#core")[0].children[2])
                this.$el.find("#core").append($("<div>").attr("id", "HTML"))
            this.$el.find("#core #HTML").show()

            this.showHTML()
        }
    }

    renderLastEntry() {
        if (this.collection[0].toJSON()[this.collection[0].toJSON().length - 2]) {
            const edCnt = this.$el.find("#core .cb-ace").get(0);

            loadScript("dist/js/libs/ace/ace.js", { scriptTag: true }).then(() => {
                var editor;
                ace.require(['ace/ace'], (loadedAce) => {
                    editor = loadedAce.edit(edCnt);

                    for (let i = 0; i < editor.getSession().getLength(); i++)
                        if (editor.getSession().getLine(i).includes("</standoff>")) {
                            let splitedXML = this.collection[0].toJSON()[this.collection[0].toJSON().length - 2].xml.split('\n'), XML = ""
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

            this.showHTML()
        }
    }

}

export default CoreView;