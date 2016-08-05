import * as Backbone from 'backbone';
import CoreEntryGroup from './model-CoreEntryGroup';

class CoreEntryGroups extends Backbone.Collection {
    constructor() {
        super();
        this.model = CoreEntryGroup;
    }
}

export default CoreEntryGroups;