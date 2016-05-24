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
              data-ptr="link"
              data-ptr_bhv="attr" href="#">Links (&lt;linkGrp>, &lt;link>)</a>
            <a class="dropdown-item cb-se-preset"
              data-wrapper="app"
              data-grp="rdgGrp"
              data-container="rdg"
              data-ptr="ptr"
              data-ptr_bhv="file"
              href="#">Apparatus entry (&lt;app>, &lt;rdg>)</a>            
            <a class="dropdown-item cb-se-preset"
              data-wrapper="lg"
              data-grp=""
              data-container="l"
              data-ptr="ptr"
              data-ptr_bhv="el" href="#">Stand off poetry (&lt;lg>, &lt;l>)</a>
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
          <div class="form-group">
            <label for="ptr_bhv">New pointers are added to:</label>
            <div class="c-inputs-stacked" id="cb-se-ptr_bhv">
              <label class="c-input c-radio">
                <input id="cb-se-ptr_bhv-attr" value="attr" name="radio-stacked" type="radio" checked>
                <span class="c-indicator"></span>
                Attribute <span class="cb-ex">(e.g. <code>&lt;link target="#ID1 #ID2"/></code>)</span>
              </label>
              <label class="c-input c-radio">
                <input id="cb-se-ptr_bhv-el" value="el" name="radio-stacked" type="radio">
                <span class="c-indicator"></span>
                New element <span class="cb-ex">(e.g. <code>&lt;link target="#ID1"/> &lt;link target="#ID2"/></code>)</span>
              </label>
              <label class="c-input c-radio">
                <input id="cb-se-ptr_bhv-file" value="file" name="radio-stacked" type="radio">
                <span class="c-indicator"></span>
                Attribute + new element for new files <span class="cb-ex">(e.g. <code>&lt;link target="F1#ID1 F1#ID2"/> &lt;link target="F2#ID1"/></code>)</span>
              </label>
            </div>
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