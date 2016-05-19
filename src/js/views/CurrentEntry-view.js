import $ from 'jquery';
import * as Backbone from 'backbone';
// import Events from '../utils/backbone-events';
import currententry_tpl from '../templates/currententry-tpl';

class CurrentEntryView extends Backbone.View {

    events() {
        return {
            
        };
    }

    initialize(options) {
        this.elementSet = options.elementSet;
        this.listenTo(this.model, 'change', this.render);
        this.listenTo(this.model.pointers, 'add', this.render);
        this.render();
    }

    updateElementSet(elset){
        this.elementSet = elset;
        this.render();
    }

    render() {
        let data = {
            "pointers" : []
        }
        for (let pointer of this.model.pointers.models) {
            data.pointers.push(pointer.toJSON());
        }
        data["es"] = this.elementSet;
        console.log(data);
        this.$el.html(currententry_tpl(data));
    }

}

export default CurrentEntryView;