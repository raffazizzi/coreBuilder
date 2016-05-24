import * as Handlebars from 'handlebars';

let currententry_tpl = `
{{#if xml}}
  <div id="cb-ce-entry">
    <code>{{xml}}</code>
  </div>
{{else}}
  <div id="cb-ce-msg">To begin building a stand-off <strong>core</strong>, 
  open an XML file and click on elements with IDs.</div>
{{/if}}
`
export default Handlebars.compile(currententry_tpl);