import * as Handlebars from 'handlebars';

let textualVariationsTpl = `
<div class="modal fade" id="cb-tv_modal" tabindex="-1" role="dialog" aria-labelledby="ViewCoreLabel">
  <div class="modal-dialog" role="document">
    <div class="modal-content">
      <div class="modal-header">
        <h4 class="modal-title" id="ViewCoreLabel">Textual variations</h4>
      </div>
      <div class="modal-body">
        {{#each this}}
          <input type="radio" id="{{this}}" name="variation">
          <label for="{{this}}">{{this}}</label><br>
        {{/each}}

        <input type="radio" id="other" name="variation">
        <label for="other">Other</label><br>

        <input type="text" id="variation" hidden><br><br>

        <div id="cb-lf-status"></div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-default" data-dismiss="modal" id="cb-se-dismiss">Do not add variation</button>
        <button type="button" class="btn btn-primary" id="cb-se-confirm">Add variation</button>
      </div>
    </div>
  </div>
</div>
`
export default Handlebars.compile(textualVariationsTpl);