import * as Backbone from 'backbone';
import saveAs from 'save-as';
import loadScript from "../utils/load-script"
import pdfMake from "pdfmake/build/pdfmake"
import pdfFonts from "pdfmake/build/vfs_fonts"
import htmlToPdfMake from "html-to-pdfmake"
import { htmlToText } from "html-to-text"

// Sadly Bootstrap js is not ES6 ready yet.
var $ = global.jQuery = require('jquery');
require('bootstrap/dist/js/umd/modal');

/**
 * Class representing interactions with the core
 * @extends Backbone.View
 */
class CoreView extends Backbone.View {
    /**
     * Initialize the view
     */
    initialize() {
        this.listenTo(this.collection[0], "add", this.renderLastEntry)
    }

    /**
     * Manage events
     * @returns Event hashing that associates events to methods in the view
     */
    events() {
        return {
            "click #cb-vc-download": "download",
            "click #toggling": "toggle"
        }
    }

    /**
     * Save the core in HTML or PDF format
     * @param format - The format of the core
     */
    saveCore(format) {
        const edCnt = this.$el.find("#core .cb-ace").get(0)

        loadScript("dist/js/libs/ace/ace.js", { scriptTag: true }).then(() => {
            var editor;
            ace.require(['ace/ace'], (loadedAce) => {
                editor = loadedAce.edit(edCnt);

                let XML = ""
                for (let i = 0; i < editor.getSession().getLength(); i++)
                    XML += editor.getSession().getLine(i)

                let childNodes = (new DOMParser).parseFromString(XML, "application/xml").querySelectorAll("standOff")[0].childNodes
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
                            else if (childNode.children[0].children[0])
                                filename = childNode.children[0].children[0].attributes[0].value.split('#')[0]
                            else
                                filename = childNode.children[0].attributes[0].value.substring(0, childNode.children[0].attributes[0].value.indexOf('#'))

                            for (let XMLFile of this.collection[1].toJSON())
                                if (XMLFile.filename == filename) {
                                    let content = XMLFile.content, title = "<title>", titleTag = content.substring(content.indexOf(title) + title.length, content.indexOf("</title>")), startTag = 'xml:id="', fromIndex = 0, note = 1, notes = "", text = "", HTML = `<!DOCTYPE html>
<html lang="en">
    <head>
        <title>`
                                    HTML += titleTag + `</title>
        
        <style>
            body {
                text-align: justify;
                font-family: roman, "times new roman", times, serif;
            }
        </style>
    </head>

    <body>
        <h1>`

                                    content = content.substring(XMLFile.content.indexOf("<text>"))
                                    HTML += titleTag + `</h1>
        `

                                    while (content.indexOf(startTag, fromIndex) != -1) {
                                        let endTag = "</" + content.substring(0, content.indexOf(startTag, fromIndex)).substring(content.substring(0, content.indexOf(startTag, fromIndex)).lastIndexOf('<') + 1).replaceAll(' ', '') + '>', tag = content.substring(content.indexOf(startTag, fromIndex), content.indexOf(endTag, fromIndex))

                                        HTML += `<span>` + tag.substring(tag.indexOf('>') + 1)
                                        text += tag.substring(tag.indexOf('>') + 1)

                                        for (let child of childNodes)
                                            if (child.nodeType == Node.ELEMENT_NODE && child.innerHTML.replaceAll(' ', '"').includes('"' + filename + '#' + tag.substring(tag.indexOf(startTag) + startTag.length, tag.indexOf('">')) + '"')) {
                                                let innerHTML = child.innerHTML.replaceAll(' ', '"')

                                                HTML += "<sup><a href='#note" + note + "'>" + note + "</a></sup>"
                                                text += "<sup><a href='#note" + note + "'>" + note + "</a></sup>"
                                                notes += '<p id="note' + note + '">' + note + '.'

                                                for (let file of this.collection[1].toJSON()) {
                                                    let XMLId = '"' + file.filename + '#'

                                                    if (file.filename != filename && innerHTML.includes(XMLId)) {
                                                        let contentTag = startTag + innerHTML.substring(innerHTML.indexOf(XMLId) + XMLId.length, innerHTML.indexOf('"', innerHTML.indexOf(XMLId) + XMLId.length)) + '">'

                                                        notes += ' ' + file.filename.split('.').slice(0, -1).join('.') + ": " + file.content.substring(file.content.indexOf(contentTag) + contentTag.length, file.content.indexOf(endTag, file.content.indexOf(contentTag) + contentTag.length))
                                                    }
                                                }

                                                notes += `</p>
        `
                                                note++
                                            }

                                        fromIndex = content.indexOf(endTag, fromIndex) + endTag.length
                                        HTML += "</span>" + content.substring(fromIndex).substring(0, content.substring(fromIndex).indexOf('<'))
                                        if (content.substring(fromIndex).substring(0, content.substring(fromIndex).indexOf('<')).includes('\n'))
                                            text += ' '
                                        text += content.substring(fromIndex).substring(0, content.substring(fromIndex).indexOf('<'))
                                    }
                                    HTML += `
        
        <h2>Notes</h2>
        `
                                    HTML += notes + `
    </body>
</html>`

                                    if (format == "html")
                                        saveAs(new Blob([HTML]), "core." + format)
                                    else {
                                        pdfMake.vfs = pdfFonts.pdfMake.vfs

                                        pdfMake.createPdf({
                                            content: [
                                                {
                                                    text: htmlToPdfMake("<h1>" + titleTag + "</h1><br><br>")
                                                },
                                                {
                                                    text: htmlToPdfMake(text),
                                                    alignment: "justify"
                                                },
                                                {
                                                    text: htmlToPdfMake("<br><h2>Notes</h2><br><br>")
                                                },
                                                {
                                                    text: htmlToText(notes)
                                                }
                                            ]
                                        }).download("core." + format)
                                    }

                                    break
                                }

                            break
                        }
                } else if (format == "html")
                    saveAs(new Blob, "core." + format)
                else
                    pdfMake.createPdf({}).download("core." + format)
            });
        });
    }

    /**
     * Download the core in XML, HTML or PDF format
     */
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
                this.saveCore("html")

                break

            case 2:
                this.saveCore("pdf")
        }
    }

    /**
     * Find the content of the XML tag
     * @param value - The value of the XML tag
     */
    findContentTag(value) {
        for (let XMLFile of this.collection[1].toJSON())
            if (XMLFile.filename == value.split('#')[0]) {
                let XMLId = XMLFile.content.indexOf('xml:id="' + value.split('#')[1] + '"')
                let string = XMLFile.content.substring(XMLFile.content.substring(0, XMLId).lastIndexOf('<'))
                let endTag = string.split(' ')[0][0] + '/' + string.split(' ')[0].substring(1) + '>'
                return string.substring(0, string.indexOf(endTag)).substring(string.substring(0, string.indexOf(endTag)).indexOf('>') + 1)
            }
    }

    /**
     * Show the file in HTML format
     */
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

                let childNodes1 = (new DOMParser).parseFromString(XML, "application/xml").querySelectorAll("standOff")[0].childNodes
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
                                childNodes2 += "<table style='border: 1px solid;"

                                for (let attribute of childNode2.attributes)
                                    if (attribute.name == "type")
                                        for (let variation of this.collection[2])
                                            if (variation.variation == attribute.value)
                                                childNodes2 += " color: " + variation.color + ';'

                                childNodes2 += "'>"

                                if (childNode1.nodeName == "lg")
                                    for (let childNode of childNode2.children)
                                        childNodes2 += "<table style='border: 1px solid;'><tr><td>" + childNode2.nodeName + "</td></tr><tr><td>" + this.findContentTag(childNode.attributes[0].value) + "</td></tr></table>"
                                else if (childNode1.nodeName != "app")
                                    for (let value of childNode2.attributes[0].value.split('  '))
                                        childNodes2 += "<table style='border: 1px solid;'><tr><td>" + childNode2.nodeName + "</td></tr><tr><td>" + this.findContentTag(value) + "</td></tr></table>"
                                else if (!childNode2.children[0].children.length) {
                                    childNodes2 += "<tr><td>" + childNode2.nodeName

                                    for (let attribute of childNode2.attributes)
                                        if (attribute.name == "type")
                                            childNodes2 += ' "' + attribute.value + '"'

                                    childNodes2 += "</td></tr><tr><td>" + this.findContentTag(childNode2.children[0].attributes[0].value) + "</td></tr>"
                                }
                                else {
                                    let childNodes3 = ""

                                    for (let childNode3 of childNode2.children) {
                                        childNodes3 += "<table style='border: 1px solid;"

                                        for (let attribute of childNode3.attributes)
                                            if (attribute.name == "type")
                                                for (let variation of this.collection[2])
                                                    if (variation.variation == attribute.value)
                                                        childNodes3 += " color: " + variation.color + ';'

                                        childNodes3 += "'><tr><td>" + childNode3.nodeName

                                        for (let attribute of childNode3.attributes)
                                            if (attribute.name == "type")
                                                childNodes3 += ' "' + attribute.value + '"'

                                        childNodes3 += "</td></tr><tr><td>"

                                        if (!childNode3.children[0].children.length)
                                            childNodes3 += this.findContentTag(childNode3.children[0].attributes[0].value)

                                        childNodes3 += "</td></tr></table>"
                                    }

                                    childNodes2 += "<tr><td>" + childNode2.nodeName

                                    for (let attribute of childNode2.attributes)
                                        if (attribute.name == "type")
                                            childNodes2 += ' "' + attribute.value + '"'

                                    childNodes2 += "</td></tr><tr><td>" + childNodes3 + "</td></tr>"
                                }

                                childNodes2 += "</table>"
                            }
                            this.$el.find("#core #HTML").append("<br /><table style='border: 1px solid;'><tr><td>" + childNode1.nodeName + childNodes2 + "</td></tr></table>")
                        }
                    })
                }
            });
        });
    }

    /**
     * Toggle file viewing between XML and HTML format
     */
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

    /**
     * Render the last entry
     */
    renderLastEntry() {
        if (this.collection[0].toJSON()[0].xml) {
            const edCnt = this.$el.find("#core .cb-ace").get(0);

            loadScript("dist/js/libs/ace/ace.js", { scriptTag: true }).then(() => {
                var editor;
                ace.require(['ace/ace'], (loadedAce) => {
                    editor = loadedAce.edit(edCnt);

                    for (let i = 0; i < editor.getSession().getLength(); i++)
                        if (editor.getSession().getLine(i).includes("</standOff>") && this.collection[0].toJSON()[0].xml) {
                            let splitedXML = this.collection[0].toJSON()[0].xml.split('\n'), XML = ""
                            for (let j = 0; j < splitedXML.length; j++) {
                                XML += '\t'
                                if (j)
                                    XML += '\t'
                                XML += splitedXML[j] + '\n'
                            }

                            if (editor.getCursorPosition().row && editor.getCursorPosition().column && this.collection[0].at(0).get("cursor"))
                                editor.getSession().insert(editor.getCursorPosition(), XML);
                            else
                                editor.getSession().insert({ column: editor.getSession().getLine(i).indexOf("</standOff>"), row: i }, XML + '\t')

                            this.collection[0].shift()

                            break
                        }
                });
            });

            this.showHTML()
        }
    }

}

export default CoreView;