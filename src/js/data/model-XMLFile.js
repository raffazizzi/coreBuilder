import * as Backbone from 'backbone';

class XMLFile extends Backbone.Model {
	get defaults(){
		return {
		    "size":  12
		  }
	}
}

export default XMLFile;