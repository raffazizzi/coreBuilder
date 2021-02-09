import * as Backbone from 'backbone';
import CoreEntry from './model-CoreEntry.js';

/**
 * Class representing the core
 * @extends Backbone.Collection
 */
class Core extends Backbone.Collection {
    /**
     * Create the core
     */
    constructor() {
        super();
        this.model = CoreEntry;
    }

    /**
     * Add a pointer to the latest core entry
     * @param pointer - The pointer
     */
    addPointer(pointer) {
        // get latest core entry and add
        this.last().pointers.add(pointer);
    }

    /**
     * Remove a pointer to the latest core entry
     * @param pointer - The pointer
     */
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