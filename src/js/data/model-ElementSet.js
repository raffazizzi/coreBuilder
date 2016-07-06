import * as Backbone from 'backbone';
import ElementSetEl from './model-ElementSetEl.js';

class ElementSet extends Backbone.Model {
    get defaults(){
        return {
            "wrapper" : new ElementSetEl({"name", "linkGrp"}),
            "grp" : new ElementSetEl(),
            "container" : new ElementSetEl(),
            "ptr" : new ElementSetEl({"name", "link"}).attributes.add({"name": "target"}),
            "ptr_bhv" : "attr"
          }
    }
}

export default ElementSet;