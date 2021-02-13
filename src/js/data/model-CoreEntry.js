import * as Backbone from 'backbone';
import CoreEntryPointers from './coll-CoreEntryPointers';
import CoreEntryGroups from './coll-CoreEntryGroups';

class CoreEntry extends Backbone.Model {

    initialize() {
        this.pointers = new CoreEntryPointers;
        this.groups = new CoreEntryGroups;
    }

    saveToCore() {
        this.set("saved", true);
    }
}

export default CoreEntry;