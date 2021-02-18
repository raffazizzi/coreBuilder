import * as Backbone from 'backbone';
import setelements_tpl from '../templates/setelements-tpl';
import setattributes_tpl from '../templates/setattributes-tpl';

// Sadly Bootstrap js is not ES6 ready yet.
var $ = global.jQuery = require('jquery');
require('../../../node_modules/bootstrap/dist/js/umd/modal');
require('../../../node_modules/bootstrap/dist/js/umd/dropdown');

/**
 * Class representing interactions when defining stand-off markup elements
 * @extends Backbone.View
 */
class SetElementsComponent extends Backbone.View {
    /**
     * Initialize the view
     * @param options - The options attached directly to the view.
     */
    initialize(options) {
        this.target = options.target;
        this.temp_attributes = {};
        for (let el in this.model.attributes) {
            if (this.model.get(el).xmlatts) {
                this.temp_attributes[el] = {};
                for (let atts of this.model.get(el).xmlatts.models) {
                    let j = atts.toJSON();
                    this.temp_attributes[el][j.cid] = j;
                }
            }
        }
        this.render();
    }

    /**
     * Manage events
     * @returns Event hashing that associates events to methods in the view
     */
    events() {
        return {
            "click .cb-se-preset": "usePreset",
            "click .cb-se-remove": "toggleInputs",
            "click #cb-se-confirm": "setElements",
            "click .cb-se-addatt": "addAttribute",
            "click .cb-se-att-remove": "removeAttribute",
            "change #cb-se-bhvrs input": "changeBehavior"
        }
    }

    /**
     * Change the behavior of stand-off markup elements
     * @param e - Event
     */
    changeBehavior(e) {
        let ptr_bhv = $(e.target).val();

        // Activate grouping if behavior is not "attr"
        if (ptr_bhv != "attr") {
            this.$el.find("#cb-se-grp-all").show();
        }
        else {
            this.$el.find("#cb-se-grp-all").hide().find("input").val("");
        }
    }

    /**
     * Change the stand-off markup elements according to the user's choice
     * @param e - Event
     */
    usePreset(e) {

        // clear all non-target attributes
        for (let att_to_x of this.$el.find(".cb-se-att-remove")) {
            let attid = $(att_to_x).data("attid");
            let target_el = $(att_to_x).data("el");

            delete this.temp_attributes[target_el][attid];
            this.$el.find("#cb-se-att-" + target_el).find("#cb-se-att-" + attid).remove();
        }

        let $target = $(e.target);
        let els = $target.data();
        let ptr_bhv = $target.data("ptr_bhv");
        let $form = this.$el.find('#cb-se-form');

        for (let el in els) {
            let $input = $form.find("#cb-se-" + el);
            let $addatt = $input.next(".cb-se-addatt");
            let $edit = $input.prev('div').find('.cb-se-remove');
            if (els[el]) {
                $input.prop('disabled', false);
                $addatt.removeClass("cb-disabled");
                $input.val(els[el]);
                $edit.removeClass('cb-off').addClass('cb-on');
            }
            else {
                $input.val("");
                $input.prop('disabled', true);
                $addatt.addClass("cb-disabled");
                $edit.removeClass('cb-on').addClass('cb-off');
            }
        }

        let atts = $target.data("atts");
        if (atts) {
            for (let el in atts) {
                for (let att in atts[el]) {
                    let data = {
                        "isTarget": false,
                        "xmlel": el,
                        "name": att,
                        "value": atts[el][att]
                    }
                    // TODO this is ugly.
                    data.cid = Math.floor(Math.random() * 1000);
                    let newatt = this.temp_attributes[el][data.cid] = data;
                    this.$el.find("#cb-se-att-" + el).append(setattributes_tpl(newatt));
                }
            }
        }

        $form.find("#cb-se-ptr_bhv-" + ptr_bhv).prop("checked", "true").change();

    }

    /**
     * Toggle element inputs
     * @param e - Event
     */
    toggleInputs(e) {
        let $edit = $(e.target);
        let $input = $edit.parent().next("input");
        let $addatt = $input.next(".cb-se-addatt");
        if ($edit.hasClass('cb-on')) {
            $input.val("");
            // Clear attributes
            let $atts = $edit.closest(".form-group").next();
            for (let att_to_x of $atts.find(".cb-se-att-remove")) {
                let attid = $(att_to_x).data("attid");
                let target_el = $(att_to_x).data("el");

                delete this.temp_attributes[target_el][attid];
                this.$el.find("#cb-se-att-" + target_el).find("#cb-se-att-" + attid).remove();
            }
            $input.prop('disabled', true);
            $addatt.addClass("cb-disabled");
            $edit.removeClass('cb-on').addClass('cb-off');
        }
        else {
            $input.prop('disabled', false);
            $addatt.removeClass("cb-disabled");
            $edit.removeClass('cb-off').addClass('cb-on');
        }
    }

    /**
     * Add an attribute
     * @param e - Event
     */
    addAttribute(e) {
        e.preventDefault();
        if (!$(e.target).hasClass("cb-disabled")) {
            let target_el = $(e.target).data("el");
            let data = { "isTarget": false, "xmlel": target_el }
            data.cid = Math.floor(Math.random() * 1000);
            let newatt = this.temp_attributes[target_el][data.cid] = data;
            this.$el.find("#cb-se-att-" + target_el).append(setattributes_tpl(newatt));
        }
    }

    /**
     * Remove an attribute
     * @param e - Event
     */
    removeAttribute(e) {
        e.preventDefault();
        let target_el = $(e.target).data("el");
        let att_id = $(e.target).data("attid");

        delete this.temp_attributes[target_el][att_id];
        this.$el.find("#cb-se-att-" + target_el).find("#cb-se-att-" + att_id).remove();
    }

    /**
     * Set stand-off markup elements
     */
    setElements() {
        let $status = this.$el.find("#cb-se-status");

        // validate: wrapper and pointer need to be specified
        if (!this.$el.find("#cb-se-wrapper").val().replace(/\s/g, "")
            || !this.$el.find("#cb-se-ptr").val().replace(/\s/g, "")) {
            $status.html(
                `<div class="alert alert-danger" role="alert">
                    A wrapper and pointer must be specified
                </div>`);
        }
        else {

            let eldata = {
                "wrapper": this.$el.find("#cb-se-wrapper").val(),
                "grp": this.$el.find("#cb-se-grp").val(),
                "container": this.$el.find("#cb-se-container").val(),
                "ptr": this.$el.find("#cb-se-ptr").val()
            }

            for (let d in eldata) {
                let m = this.model.get(d);
                m.set("name", eldata[d]);

                // confirm attributes data
                m.xmlatts.reset();
                let temp_a = this.temp_attributes[d];
                for (let att in temp_a) {
                    let attdata = this.$el.find("#cb-se-att-" + att);
                    let name = attdata.find(".cb-se-att-name").val();
                    let value = attdata.find(".cb-se-att-value").val();
                    let new_att = m.xmlatts.add({ "name": name });
                    if (!temp_a[att].isTarget) {
                        new_att.set("value", value);
                    }
                    else {
                        new_att.set("isTarget", true);
                    }
                }

            }

            this.model.set("ptr_bhv", this.$el.find("#cb-se-ptr_bhv").find("input:checked").val());
            // Lastly kick off events.
            this.model.trigger("change");

            $status.html(
                `<div class="alert alert-success" role="alert">
                    OK!
                </div>`);
            setTimeout(() => {
                this.$el.find("#cb-se_modal").modal('hide').data('bs.modal', null);
            }, 250);
        }
    }

    /**
     * Transform selected attributes into XML type attributes
     */
    renderAttributes() {
        for (let xmlel in this.temp_attributes) {
            let xmlatts = this.temp_attributes[xmlel];
            if (xmlatts) {
                for (let a in xmlatts) {
                    xmlatts[a].xmlel = xmlel;
                    this.$el.find("#cb-se-att-" + xmlel).append(setattributes_tpl(xmlatts[a]));
                }
            }
        }
    }

    /**
     * Render all the stand-off markup elements
     */
    render() {

        let component = $(setelements_tpl(this.model.toJSON()));
        component.find("#cb-se-ptr_bhv-" + this.model.get("ptr_bhv")).prop("checked", "true");

        // hide grouping element options if behavior is "attr"
        if (this.model.get("ptr_bhv") == "attr") {
            component.find("#cb-se-grp-all").hide().find("input").val("");
        }

        this.target.append(this.$el.append(component));

        this.renderAttributes();

        component.modal('show');

    }

}

export default SetElementsComponent;