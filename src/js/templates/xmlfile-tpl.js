import * as Handlebars from 'handlebars';

let xmlfile_tpl = `
<div class="cb-xf-title row">
    <div class="col-xs-6">{{filename}}</div>
    <div class="btn-group btn-group-sm cb-ce-entry-ctrls cb-xf-controls" role="group">
        <button type="button" class="btn btn-secondary-outline cb-xf-xpointer" data-toggle="button"><i class="fa fa-hand-o-down"></i> <span>XPointer</span></button>
        <button type="button" class="btn btn-secondary-outline" data-toggle="button"><strong>Ø</strong> <span>Add Empty</span></button>
        <button type="button" class="btn btn-secondary-outline cb-xf-close"><i class="fa fa-times"></i> <span>Close</span></button>
    </div>
    <div class="cb-xf-xp-drawer">
    	<span class="cb-xf-xp-msg">Make a selection</span>
    	<span class="cb-xf-xp-d-ctrls">
	    	<a href="#" class="cb-xf-xp-d-b cb-xf-xp-cancel"><i class="fa fa-times"></i></a>
	    	<a href="#" class="cb-xf-xp-d-b cb-xf-xp-ok"><i class="fa fa-check"></i></a>
	    </div>
    </div>
</div>
<div class="cb-ace"></div>
`

export default Handlebars.compile(xmlfile_tpl);