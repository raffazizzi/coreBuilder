import * as Backbone from 'backbone';
import XMLFile from './model-XMLFile.js';

class XMLFiles extends Backbone.Collection {
	constructor() {
		super();
		this.model = XMLFile;
	}
}

export default XMLFiles;