import * as Handlebars from 'handlebars';

let setattributes_tpl = `
<div class="form-group cb-se-att-data" id="cb-se-att-{{cid}}">
  <div class="input-group">
    {{#if isTarget}}{{else}}<div class="input-group-addon"><a data-el="{{xmlel}}" data-attid="{{cid}}" class="cb-plain cb-se-att-remove cb-on" href="#"></a></div>{{/if}}
    <div class="input-group-addon">@</div>
    <input type="text" class="form-control cb-se-att-name" value="{{name}}">
    <div class="input-group-addon">=</div>
    <input type="text" class="form-control cb-se-att-value" value="{{value}}" {{#if isTarget}}disabled{{/if}}>
  </div>
</div>
`
export default Handlebars.compile(setattributes_tpl);