import * as Backbone from 'backbone';
import ElementSetAtt from './model-ElementSetAtt.js';

class ElementSetAtts extends Backbone.Collection {
	constructor() {
		super();
		this.model = ElementSetAtt;
	}
}

export default ElementSetAtts;