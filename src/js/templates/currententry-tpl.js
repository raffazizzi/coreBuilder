import * as Handlebars from 'handlebars';

// let currententry_tpl = `
// {{#if xml}}
//   <div id="cb-ce-entry">
//     <code>{{xml}}</code>
//   </div>
// {{else}}
//   <div id="cb-ce-msg">To begin building a stand-off <strong>core</strong>, 
//   open an XML file and click on elements with IDs.</div>
// {{/if}}

let currententry_tpl = `
<div id="cb-ce-entry">
  <div id="cb-ce-entry-menu">
    <div class="btn-group btn-group-sm" role="group">
      <button type="button" class="btn btn-sm btn-secondary-outline" id="cb-ce-undock"><i class="fa fa-expand fa-flip-horizontal"></i></button> 
      <button type="button" class="btn btn-sm btn-secondary-outline" id="cb-ce-minimize"><strong>_</strong></button> 
    </div>
    <div class="btn-group btn-group-sm cb-ce-entry-ctrls" role="group">
      <button type="button" class="btn btn-secondary" data-toggle="button" aria-pressed="false" id="cb-ce-xml"><i class="fa fa-code"></i> <span>XML</span></button>
      <div class="btn-group btn-group-sm" role="group">
        <button id="cb-ce-groupsDrop" type="button" class="btn btn-secondary dropdown-toggle" data-toggle="dropdown">
          <i class="fa fa-link"></i> <span>Groups</span>
        </button>
        <div class="dropdown-menu">
          <a class="dropdown-item" href="#">Dropdown link</a>
          <a class="dropdown-item" href="#">Dropdown link</a>
        </div>
      </div>
    </div>
  </div>
  <div id="cb-ce-entry-body"></div>
  <div id="cb-ce-entry-btns">
    <button type="button" class="btn btn-sm btn-danger" id="cb-ce-cancel"><i class="fa fa-trash-o"></i> Cancel</button>
    <button type="button" class="btn btn-sm btn-success" id="cb-ce-add"><i class="fa fa-plus"></i> Add entry</button>
    </span>
  </div>
</div>
<div id="cb-ce-msg">To begin building a stand-off <strong>core</strong>, 
open an XML file and click on elements with IDs.</div>
`

export default Handlebars.compile(currententry_tpl);