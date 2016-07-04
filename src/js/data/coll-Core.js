import * as Backbone from 'backbone';
import CoreEntry from './model-CoreEntry.js';

class Core extends Backbone.Collection {
    constructor() {
        super();
        this.model = CoreEntry;
    }

    addPointer(pointer) {
        // get latest core entry and add
        this.last().pointers.add(pointer);
    }

    removePointer(pointer) {
        // get latest core entry and find pointer to remove
        for (let ptr of this.last().pointers.models) {
        	if (ptr.get("cb_xml_file_model") == pointer.cb_xml_file_model) {
        		ptr.destroy();
        	}
        };
    }

}

export default Core;