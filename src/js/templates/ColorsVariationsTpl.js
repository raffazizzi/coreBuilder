import * as Handlebars from 'handlebars';

let ColorsVariationsTpl = `
<div class="modal fade" id="cb-tv_modal" tabindex="-1" role="dialog" aria-labelledby="ViewCoreLabel">
  <div class="modal-dialog" role="document">
    <div class="modal-content">
      <div class="modal-header">
        <h4 class="modal-title" id="ViewCoreLabel">Colors variations</h4>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-default" data-dismiss="modal" id="cb-se-dismiss">Close</button>
        <button type="button" class="btn btn-primary" id="cb-se-confirm">Apply</button>
      </div>
    </div>
  </div>
</div>
`
export default Handlebars.compile(ColorsVariationsTpl);