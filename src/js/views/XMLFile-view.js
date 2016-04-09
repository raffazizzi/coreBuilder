import $ from 'jquery';
import * as Backbone from 'backbone';
import Events from '../utils/backbone-events';
import loadScript from '../utils/load-script';
import xmlfile_tpl from '../templates/xmlfile-tpl';

class XMLFileView extends Backbone.View {

    get className() {
        return "cb-XMLFile";
    }

    events() {
        return {
            'click .cb-xf-controls > a' : 'remove'
        };
    }

    initialize(options) {
    	this.listenTo(Events, "XMLFile:resize", this.resize)
    }

    resize(size) {

    	this.model.size = size;

    	this.$el.removeClass (function (i, css) {
            return (css.match (/(^|\s)col-\S+/g) || []).join(' ');
        });
        this.$el.addClass('col-xs-'+size);
    }

    render() {
    	this.$el.addClass('col-xs-'+this.model.size);

        this.$el.append(xmlfile_tpl(this.model.toJSON()));

        // const ed_cnt = this.el;
        const ed_cnt = this.$el.find(".cb-ace").get(0);

        // TODO: Determine here if XML?
        // TODO: need to parametrize ace URL somehow, or make generally more reliable
        loadScript("/dist/js/libs/ace/ace.js", { scriptTag: true }).then(() => {
          ace.require(['ace/ace'], (loadedAce) => {
            const editor = loadedAce.edit(ed_cnt);

            editor.setTheme("ace/theme/chrome");
            editor.setShowPrintMargin(false);
            editor.setReadOnly(true)
            editor.getSession().setMode("ace/mode/xml");
            editor.$blockScrolling = Infinity;
            editor.getSession().insert({column:0, row:0}, this.model.get("content"));
            editor.moveCursorTo({column:0, row:0});
          });
        });
        return this.$el;
    }

    remove(e) {
        if (e) e.preventDefault();
        this.$el.empty();
        this.$el.remove();
        
        this.model.destroy();
    }

}

export default XMLFileView;