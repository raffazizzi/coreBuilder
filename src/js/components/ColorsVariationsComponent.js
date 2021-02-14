import * as Backbone from 'backbone';
import ColorsVariationsTpl from '../templates/ColorsVariationsTpl';

var $ = global.jQuery = require('jquery');
require('bootstrap/dist/js/umd/modal');

/**
 * Class representing interactions when selecting colors variations
 * @extends Backbone.View
 */
class ColorsVariationsComponent extends Backbone.View {
    /**
     * Initialize the view
     */
    initialize() {
        this.render();
    }

    /**
     * Show the modal window
     */
    render() {
        let component = $(ColorsVariationsTpl());
        component.modal('show');
    }
}

export default ColorsVariationsComponent;