import * as Handlebars from 'handlebars';

let xmlfile_tpl = `
<div class="cb-xf-title row">
    <div class="col-xs-6">{{filename}}</div>
    <div class="btn-group btn-group-sm cb-ce-entry-ctrls cb-xf-controls" role="group">
        <button type="button" class="btn btn-secondary-outline cb-xf-xpointer" data-toggle="button"><i class="fa fa-hand-o-down"></i> <span>XPointer</span></button>
        <button type="button" class="btn btn-secondary-outline" data-toggle="button"><strong>Ø</strong> <span>Add Empty</span></button>
        <button type="button" class="btn btn-secondary-outline cb-xf-close"><i class="fa fa-times"></i> <span>Close</span></button>
    </div>
</div>
<div class="cb-ace"></div>
`

export default Handlebars.compile(xmlfile_tpl);