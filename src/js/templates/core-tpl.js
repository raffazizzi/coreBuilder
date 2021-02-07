import * as Handlebars from 'handlebars';

let core_tpl = `
<div id="coreHeader">
    <div id="coreSubHeader">
        <h4 id="ViewCoreLabel">View Core</h4>
        <button type="button" class="btn btn-sm btn-primary" id="cb-vc-download"><i class="fa fa-download"></i> Download Core</button>
    </div>
    <button type="button" class="btn btn-secondary" id="toggling">
        <i class="fa fa-code"></i>
        <span>HTML</span>
    </button>
</div>
<div class="cb-XMLFile"></div>
`
export default Handlebars.compile(core_tpl);