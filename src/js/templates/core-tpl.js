import * as Handlebars from 'handlebars';

let core_tpl = `
<h4 id="ViewCoreLabel">View Core</h4>
<button type="button" class="btn btn-sm btn-primary" id="cb-vc-download"><i class="fa fa-download"></i> Download Core</button>
<div id="coreEntries"></div>
`
export default Handlebars.compile(core_tpl);