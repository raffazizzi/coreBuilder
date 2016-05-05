import * as Handlebars from 'handlebars';

let setelement_tpl = `
<div class="modal fade" id="cb-se_modal" tabindex="-1" role="dialog" aria-labelledby="SetElementsLabel">
  <div class="modal-dialog" role="document">
    <div class="modal-content">
      <div class="modal-header">
        <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
        <h4 class="modal-title" id="SetElementsLabel">Set Stand-off Elements</h4>
      </div>
      <div class="modal-body">
        <div class="dropdown">
          <button class="btn btn-default dropdown-toggle" type="button" id="cb-se-preset" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
            Choose preset
          </button>
          <div class="dropdown-menu" aria-labelledby="cb-se-preset">
            <a class="dropdown-item cb-se-preset"
              data-wrapper="linkGrp"
              data-grp=""
              data-container=""
              data-ptr="link" href="#">Links (&lt;linkGrp>, &lt;link>)</a>
            <a class="dropdown-item cb-se-preset"
              data-wrapper="app"
              data-grp="rdgGrp"
              data-container="rdg"
              data-ptr="ptr" href="#">Apparatus entry (&lt;app>, &lt;rdg>)</a>            
            <a class="dropdown-item cb-se-preset"
              data-wrapper="lg"
              data-grp=""
              data-container="l"
              data-ptr="ptr" href="#">Stand off poetry (&lt;lg>, &lt;l>)</a>
          </div>
        </div>
        <form role="form" id="cb-se-form">
          <div class="form-group">
            <label for="wrapper">Wrapper</label>
            <div class="input-group">
              <div class="input-group-addon">&nbsp;</div>
              <input type="text" class="form-control" id="cb-se-wrapper"
                     value="{{wrapper}}">
            </div>
          </div>
          <div id="cb-se-att-wrapper" class="panel-collapse collapse">

          </div>
          <div class="form-group">
            <label for="grp">Grouping element</label>
            <div class="input-group">
              <div class="input-group-addon"><a class="cb-plain cb-se-remove cb-off" href="#"></a></div>
              <input type="text" class="form-control" id="cb-se-grp" value="{{grp}}" disabled>
              <!-- <div class="input-group-addon">
                <a data-toggle="collapse" data-target="#att-grp" 
                   class="collapsed" href="#">
                  @
                </a>
              </div> -->
            </div>
          </div>
          <div id="cb-se-att-grp" class="panel-collapse collapse">
          
          </div>
          <div class="form-group">
            <label for="container">Container</label>
            <div class="input-group">
              <div class="input-group-addon"><a class="cb-plain cb-se-remove cb-off " href="#"></a></div>
              <input type="text" class="form-control" id="cb-se-container" value="{{container}}" disabled>
              <!-- <div class="input-group-addon">
                <a data-toggle="collapse" data-target="#att-container" 
                   class="collapsed" href="#">
                  @
                </a>
              </div> -->
            </div>
          </div>
          <div id="cb-se-att-container" class="panel-collapse collapse">
            
          </div>
          <div class="form-group">
            <label for="ptr">Pointer</label>
            <div class="input-group">
              <div class="input-group-addon">&nbsp;</div>
              <input type="text" class="form-control" id="cb-se-ptr"
                   value="link">
              <!-- <div class="input-group-addon">
                <a data-toggle="collapse" data-target="#att-ptr" href="#">
                  @
                </a>
              </div> -->
            </div>
          </div>
          <div id="cb-se-att-ptr" class="panel-collapse collapse in">
            
          </div>
        </form>
      </div>
      <div id="cb-se-status"></div>
      <div class="modal-footer">
        <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
        <button type="button" class="btn btn-primary" id="cb-se-confirm">Apply</button>
      </div>
    </div>
  </div>
</div>
`
export default Handlebars.compile(setelement_tpl);