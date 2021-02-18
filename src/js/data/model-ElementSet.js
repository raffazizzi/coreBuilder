import * as Backbone from 'backbone';
import ElementSetEl from './model-ElementSetEl.js';

/**
 * Class representing stand-off markup elements
 * @extends Backbone.Model
 */
class ElementSet extends Backbone.Model {
    /**
     * Get specified default attributes
     * @returns The default attributes
     */
    get defaults() {
        let ptr_model = new ElementSetEl({ "name": "link" });
        ptr_model.xmlatts.add({ "name": "target", "isTarget": true });
        return {
            "wrapper": new ElementSetEl({ "name": "linkGrp" }),
            "grp": new ElementSetEl(),
            "container": new ElementSetEl(),
            "ptr": ptr_model,
            "ptr_bhv": "attr"
        }
    }
}

export default ElementSet;