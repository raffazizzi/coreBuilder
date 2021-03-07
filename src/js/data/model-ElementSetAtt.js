import * as Backbone from 'backbone';

/**
 * Class representing the XML attribute selected by the user
 * @extends Backbone.Model
 */
class ElementSetAtt extends Backbone.Model {
	/**
	 * Create an XML attribute
	 * @param args - The arguments
	 */
	constructor(...args) {
		super(...args);

		// Extend toJSON to include cid
		this.toJSON = (...args) => {
			let json = Backbone.Model.prototype.toJSON.apply(this, ...args);
			json.cid = this.cid;
			return json;
		}
	}
}

export default ElementSetAtt;