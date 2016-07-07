import * as Backbone from 'backbone';
import ElementSetEl from './model-ElementSetEl.js';

class ElementSet extends Backbone.Model {
    get defaults(){
        let ptr_model = new ElementSetEl({"name": "link"});
        ptr_model.xmlatts.add({"name": "target", "isTarget": true});
        return {
            "wrapper" : new ElementSetEl({"name": "linkGrp"}),
            "grp" : new ElementSetEl(),
            "container" : new ElementSetEl(),
            "ptr" : ptr_model,
            "ptr_bhv" : "attr"
          }
    }
}

export default ElementSet;