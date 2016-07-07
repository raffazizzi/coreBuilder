import * as Backbone from 'backbone';
import ElementSetAtts from './coll-ElementSetAtts';

class ElementSetEl extends Backbone.Model {
	initialize() {
        this.xmlatts = new ElementSetAtts;
    }
}

export default ElementSetEl;