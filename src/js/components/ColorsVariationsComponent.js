import * as Backbone from 'backbone';
import ColorsVariationsTpl from '../templates/ColorsVariationsTpl';

var $ = global.jQuery = require('jquery');

/**
 * Class representing interactions when selecting colors variations
 * @extends Backbone.View
 */
class ColorsVariationsComponent extends Backbone.View {
    /**
     * Initialize the view
     * @param options - The options attached directly to the view.
     */
    initialize(options) {
        this.target = options.target
        this.elementSet = options.elementSet
        this.coreView = options.coreView
        this.currentEntry = options.currentEntry

        this.render();

        this.variations = []

        for (let i = 0; i < this.$el.find(".colors").length; i++)
            this.$el.find(".colors")[i].addEventListener("change", (event) => {
                this.variations.push([i, event.target.value])
            })
    }

    /**
     * Manage events
     * @returns Event hashing that associates events to methods in the view
     */
    events() {
        return {
            "click #cb-se-confirm": "setColorsVariations"
        }
    }

    /**
     * Show the modal window
     */
    render() {
        let component = $(ColorsVariationsTpl(this.currentEntry.addVariations()))

        this.target.append(this.$el.append(component))
        component.modal('show')
    }

    /**
     * Set colors variations
     */
    setColorsVariations() {
        for (let variation of this.variations)
            this.collection[variation[0]]["color"] = variation[1]

        this.coreView.showHTML()

        this.$el.find('#cb-se-status').html(
            `<div class="alert alert-success" role="alert">
                OK!
            </div>`);
        setTimeout(() => {
            this.$el.find("#cb-tv_modal").modal('hide').data('bs.modal', null);
        }, 250)
    }
}

export default ColorsVariationsComponent;