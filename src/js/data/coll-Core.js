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

}

export default Core;