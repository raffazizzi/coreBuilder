import * as Backbone from 'backbone';
import textualVariationsTpl from '../templates/textualvariations-tpl';

// Sadly Bootstrap js is not ES6 ready yet.
var $ = global.jQuery = require('jquery');
require('../../../node_modules/bootstrap/dist/js/umd/modal');

class TextualVariationsComponent extends Backbone.View {
    initialize(options) {
        this.currentEntry = options.currentEntry
        this.index = options.index
        this.variation = ""

        // Events
        for (let variation of this.currentEntry.addVariations())
            this.$el.on('click', '#' + variation, () => {
                this.variation = variation
                this.$el.find("#variation").attr("hidden", "")
                this.$el.find('#cb-lf-status').html("")
            });

        this.$el.on('click', '#other', () => {
            this.variation = "Other"
            this.$el.find("#variation").removeAttr("hidden")
            this.$el.find('#cb-lf-status').html("")
        });

        this.render();
    }

    events() {
        return {
            "click #cb-se-dismiss": "doNotAddVariation",
            "click #cb-se-confirm": "addVariation"
        }
    }

    render() {
        let component = $(textualVariationsTpl(this.currentEntry.addVariations()));
        this.currentEntry.model.target.append(this.$el.append(component));
        component.modal('show');
    }

    doNotAddVariation() {
        this.currentEntry.model.lastCore.toJSON().json.content[this.index].done = true

        this.currentEntry.renderData()
    }

    addVariation() {
        if (this.variation) {
            this.currentEntry.model.lastCore.toJSON().json.content[this.index].done = true

            if (this.variation == "Other")
                this.currentEntry.model.lastCore.toJSON().json.content[this.index].xmlatts.push({ name: "type", value: this.$el.find("#variation").val() })
            else
                this.currentEntry.model.lastCore.toJSON().json.content[this.index].xmlatts.push({ name: "type", value: this.variation })

            this.currentEntry.renderData()

            this.$el.find('#cb-lf-status').html(
                `<div class="alert alert-success" role="alert">
                    OK!
                </div>`);
            setTimeout(() => {
                this.$el.find("#cb-tv_modal").modal('hide').data('bs.modal', null);
            }, 250);
        } else if (!this.variation || !this.$el.find("#variation").val())
            this.$el.find('#cb-lf-status').html(
                `<div class="alert alert-danger" role="alert">
                Please indicate a variation
            </div>`)
    }
}

export default TextualVariationsComponent;