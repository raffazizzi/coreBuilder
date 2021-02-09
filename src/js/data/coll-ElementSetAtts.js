import * as Backbone from 'backbone';
import ElementSetAtt from './model-ElementSetAtt.js';

/**
 * Class representing ElementSetAtt objects
 * @extends Backbone.Collection
 */
class ElementSetAtts extends Backbone.Collection {
	/**
	 * Create the ElementSetAtts object
	 */
	constructor() {
		super();
		this.model = ElementSetAtt;
	}
}

export default ElementSetAtts;