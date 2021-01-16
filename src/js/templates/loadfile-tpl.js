export default `
<div class="modal fade" id="cb-lf_modal" tabindex="-1" role="dialog" aria-labelledby="LoadFileLabel">
  <div class="modal-dialog" role="document">
    <div class="modal-content">
      <div class="modal-header">
        <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
        <h4 class="modal-title" id="LoadFileLabel">Add file</h4>
      </div>
      <div class="modal-body">

        <ul class="nav nav-tabs" id="cb-lf-addfiletabs" role="tablist">
          <li class="nav-item">
            <a class="nav-link active" href="#cb-lf-upload" data-toggle="tab" role="tab">Upload</a>
          </li>
          <li class="nav-item">
            <a class="nav-link" href="#cb-lf-web" data-toggle="tab" role="tab">Web Address (URL)</a>
          </li>
        </ul>

        <!-- Tab panes -->
        <div class="tab-content" id="cb-lf-addfiletabcontent">
          <div role="tabpanel" class="tab-pane active" id="cb-lf-upload">
            <div class="upload-drop-zone" id="cb-lf-drop-files">
              Just drag and drop files here or click browse files
            </div>
            <div type="button" class="btn btn-primary btn-file" id="btn-files">
                Browse files<input type="file" multiple="multiple">
            </div> <span id="cb-lf-filesselected"></span>
            <div class="upload-drop-zone" id="cb-lf-drop-core">
              Just drag and drop a core here or click browse a core
            </div>
            <div type="button" class="btn btn-primary btn-file" id="btn-core">
                Browse a core<input type="file">
            </div> <span id="cb-lf-coreselected"></span>
            <div class="cb-lf-progress">
              <progress class="progress progress-striped progress-info" value="0" max="100">0%</progress>
            </div>            
          </div>
          <div role="tabpanel" class="tab-pane" id="cb-lf-web">
            <div class="form-group">
              <input type="email" class="form-control" id="cb-fl-web-input" placeholder="Enter URL">
              <small class="form-text text-muted"><strong>Important:</strong> remote XML documents can only be accessed if 
              they are on the same server as <emph>coreBuilder</emph> or if the server where they are located supports 
              <a href="https://en.wikipedia.org/wiki/Cross-origin_resource_sharing">CORS</a> (such as GitHub).</small>
            </div>
          </div>
        </div>
        <div id="cb-lf-status"></div> 
      </div>      
      <div class="modal-footer">
        <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
        <button type="button" class="btn btn-primary" id="cb-lf-open">Open</button>
      </div>
    </div>
  </div>
</div>
`