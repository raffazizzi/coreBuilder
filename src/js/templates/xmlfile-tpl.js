import * as Handlebars from 'handlebars';

let xmlfile_tpl = `
<div class="cb-xf-title row">
    <div class="col-xs-6">{{filename}}</div>
    <div class="col-xs-6 cb-xf-controls"><a href="#">close</a></div>
</div>
<div class="cb-ace"></div>
`

export default Handlebars.compile(xmlfile_tpl);