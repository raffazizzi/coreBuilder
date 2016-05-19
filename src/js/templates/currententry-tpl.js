import * as Handlebars from 'handlebars';

let currententry_tpl = `
{{#if pointers}}
  <div id="cb-ce-entry">
    <pre>
&lt;{{es.wrapper}}>{{#if es.container}}  
  &lt;{{es.container}}>
{{#each pointers}}    &lt;{{../es.ptr}} target="{{xml_file}}#{{xmlid}}"/>
{{/each}}
  &lt;/{{es.container}}>{{else}}{{#each pointers}}
  &lt;{{../es.ptr}} target="{{xml_file}}#{{xmlid}}"/>{{/each}}{{/if}}
&lt;/{{es.wrapper}}>
    </pre>
  </div>
{{else}}
  <div id="cb-ce-msg">To begin building a stand-off <strong>core</strong>, 
  open an XML file and click on elements with IDs.</div>
{{/if}}
`
export default Handlebars.compile(currententry_tpl);