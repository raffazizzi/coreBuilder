import * as Backbone from 'backbone';
import CoreEntryPointer from './model-CoreEntryPointer';

/**
 * Class representing CoreEntryPointer objects
 * @extends Backbone.Collection
 */
class CoreEntryPointers extends Backbone.Collection {
    /**
     * Create the CoreEntryPointers object
     */
    constructor() {
        super();
        this.model = CoreEntryPointer;
    }
}

export default CoreEntryPointers;