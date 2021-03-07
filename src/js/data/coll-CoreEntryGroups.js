import * as Backbone from 'backbone';
import CoreEntryGroup from './model-CoreEntryGroup';

/**
 * Class representing CoreEntryGroup objects
 * @extends Backbone.Collection
 */
class CoreEntryGroups extends Backbone.Collection {
    /**
     * Create the CoreEntryGroups object
     */
    constructor() {
        super();
        this.model = CoreEntryGroup;
    }
}

export default CoreEntryGroups;