import * as Backbone from 'backbone';
import XMLFile from './model-XMLFile.js';

/**
 * Class representing XMLFile objects
 * @extends Backbone.Collection
 */
class XMLFiles extends Backbone.Collection {
	/**
	 * Create the XMLFiles object
	 */
	constructor() {
		super();
		this.model = XMLFile;
	}
}

export default XMLFiles;