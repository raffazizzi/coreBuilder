import * as Backbone from 'backbone';
import CoreEntryPointer from './model-CoreEntryPointer';

class CoreEntryPointers extends Backbone.Collection {
    constructor() {
        super();
        this.model = CoreEntryPointer;
    }
}

export default CoreEntryPointers;