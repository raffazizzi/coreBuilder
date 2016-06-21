import * as Backbone from 'backbone';
import CoreEntryPointers from './coll-CoreEntryPointers';

class CoreEntry extends Backbone.Model {

    initialize() {
        this.pointers = new CoreEntryPointers;
    }

    saveToCore() {
    	this.set("saved", true);
    	// Add new entry to Core.
    	this.collection.add({});
    }
}

export default CoreEntry;