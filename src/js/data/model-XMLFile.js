import * as Backbone from 'backbone';

/**
 * Class representing an XML file
 */
class XMLFile extends Backbone.Model {
	/**
	 * Get the specified default attribute
	 * @returns The size
	 */
	get defaults() {
		return {
			"size": 12
		}
	}
}

export default XMLFile;