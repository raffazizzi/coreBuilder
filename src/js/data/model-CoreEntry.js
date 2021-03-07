import * as Backbone from 'backbone';
import CoreEntryPointers from './coll-CoreEntryPointers';
import CoreEntryGroups from './coll-CoreEntryGroups';

/**
 * Class representing a core entry
 * @extends Backbone.Model
 */
class CoreEntry extends Backbone.Model {

    /**
     * Initialize attributes
     */
    initialize() {
        this.pointers = new CoreEntryPointers;
        this.groups = new CoreEntryGroups;
    }

    /**
     * Save a core entry to core
     */
    saveToCore() {
        this.set("saved", true);
    }
}

export default CoreEntry;