import * as Backbone from 'backbone';

class ElementSetAtt extends Backbone.Model {
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