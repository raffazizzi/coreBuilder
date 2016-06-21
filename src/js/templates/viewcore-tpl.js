import * as Handlebars from 'handlebars';

let viewcore_tpl = `
<div class="modal fade" id="cb-vc_modal" tabindex="-1" role="dialog" aria-labelledby="ViewCoreLabel">
  <div class="modal-dialog" role="document">
    <div class="modal-content">
      <div class="modal-header">
        <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
        <h4 class="modal-title" id="ViewCoreLabel">View Core</h4>
        <div>
          <button type="button" class="btn btn-sm btn-primary" id="cb-vc-download"><i class="fa fa-download"></i> Download Core</button>
        </div>
      </div>
      <div class="modal-body">
        {{#each this}}
        <div data-entry="{{this.id}}">
          <pre class="language-markup"><button type="button" class="close cb-vc-remove">×</button><code class="language-markup">{{this.xml}}</code></pre>
        </div>
        {{/each}}
      </div>
    </div>
  </div>
</div>
`
export default Handlebars.compile(viewcore_tpl);