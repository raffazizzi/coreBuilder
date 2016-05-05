import * as Backbone from 'backbone';

class ElementSet extends Backbone.Model {
    get defaults(){
        return {
            "wrapper" : "linkGrp",
            "grp" : "",
            "container" : "",
            "ptr" : "link",
            "ptr_attr" : "target"
          }
    }
}

export default ElementSet;