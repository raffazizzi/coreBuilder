import * as Backbone from 'backbone';
import CoreEntryPointers from './coll-CoreEntryPointers';

class CoreEntry extends Backbone.Model {

    initialize() {
        this.pointers = new CoreEntryPointers;
    }
}

export default CoreEntry;