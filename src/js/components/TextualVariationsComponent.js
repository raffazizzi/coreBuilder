import * as Backbone from 'backbone';
import textualVariationsTpl from '../templates/textualvariations-tpl';

// Sadly Bootstrap js is not ES6 ready yet.
var $ = global.jQuery = require('jquery');
require('../../../node_modules/bootstrap/dist/js/umd/modal');

class TextualVariationsComponent extends Backbone.View {
    initialize(options) {
        this.target = options.target;
        this.model = options.model
        this.index = options.index
        this.variations = options.variations
        this.variation = ""

        // Events
        for (let variation of this.variations)
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
            "click #cb-se-confirm": "applyVariation"
        }
    }

    render() {
        let component = $(textualVariationsTpl(this.variations));
        this.target.append(this.$el.append(component));
        component.modal('show');
    }

    applyVariation() {
        if (this.variation) {
            if (this.variation == "Other")
                this.model.toJSON().json.content[this.index].xmlatts.push({ name: "type", value: this.$el.find("#variation").val() })
            else
                this.model.toJSON().json.content[this.index].xmlatts.push({ name: "type", value: this.variation })

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