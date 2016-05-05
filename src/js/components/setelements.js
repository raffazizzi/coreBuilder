import * as Backbone from 'backbone';
import setelements_tpl from '../templates/setelements-tpl';
// import Events from '../utils/backbone-events.js';

// Sadly Bootstrap js is not ES6 ready yet.
var $ = global.jQuery = require('jquery');
require('../../../node_modules/bootstrap/dist/js/umd/modal');
require('../../../node_modules/bootstrap/dist/js/umd/dropdown');

class SetElementsComponent extends Backbone.View {
    
    initialize(options){
        this.target = options.target;
        this.render();
    }

    events() {
        return {
            "click .cb-se-preset" : "usePreset",
            "click .cb-se-remove" : "toggleInputs",
            "click #cb-se-confirm" : "setElements"
        }
    }

    usePreset(e) {
        let $target = $(e.target);
        let els = $target.data();
        let $form = this.$el.find('#cb-se-form');

        for (let el in els) {
            let $input = $form.find("#cb-se-" + el);
            let $edit = $input.prev('div').find('.cb-se-remove');
            if (els[el]) {
                $input.prop('disabled', false);
                $input.val(els[el]);
                $edit.removeClass('cb-off').addClass('cb-on');
            } 
            else {
                $input.val("");
                $input.prop('disabled', true);
                $edit.removeClass('cb-on').addClass('cb-off');
            }
        }        

    }

    toggleInputs(e) {
        let $edit = $(e.target);
        let $input = $edit.parent().next("input");
        if ($edit.hasClass('cb-on')){
            $input.val("");
            $input.prop('disabled', true);
            $edit.removeClass('cb-on').addClass('cb-off');
        }
        else {
            $input.prop('disabled', false);
            $edit.removeClass('cb-off').addClass('cb-on');   
        }
    }

    setElements() {
        let $status = this.$el.find("#cb-se-status");

        // validate: wrapper and pointer need to be specified
        if (!this.$el.find("#cb-se-wrapper").val().replace(/\s/g, "") 
         || !this.$el.find("#cb-se-ptr").val().replace(/\s/g, "") ) {
            $status.html(
                `<div class="alert alert-danger" role="alert">
                    A wrapper and pointer must be specified
                </div>`);
        }
        else {
            let data = {
                "wrapper" : $("#cb-se-wrapper").val(),
                "grp" : $("#cb-se-grp").val(),
                "container" : $("#cb-se-container").val(),
                "ptr" : $("#cb-se-ptr").val()
            }
            this.model.set(data);
            console.log(this.model);
            this.$el.find("#cb-se_modal").modal( 'hide' ).data( 'bs.modal', null );
        }
    }

    render() {

        let component = $(setelements_tpl(this.model.toJSON()));
        this.target.append(this.$el.append(component));

        component.modal('show');

    }

}

export default SetElementsComponent;