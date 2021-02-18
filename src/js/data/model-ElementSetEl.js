import * as Backbone from 'backbone';
import ElementSetAtts from './coll-ElementSetAtts';

/**
 * Class representing a stand-off markup element
 * @extends Backbone.Model
 */
class ElementSetEl extends Backbone.Model {
    /**
     * Initialize the attribute
     */
    initialize() {
        this.xmlatts = new ElementSetAtts;
    }
}

export default ElementSetEl;