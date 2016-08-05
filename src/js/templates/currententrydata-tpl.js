import * as Handlebars from 'handlebars';

let currententrydata_tpl = `
<div id="cb-ce-entry-items">
  <ul>
    <li>
      <span class="cb-ce-ctrls" data-targets="all">
        <i class="cb-ce-ctrls-del fa fa-times"></i>
      </span>
      <span>{{wrapper.name}}</span>
      <!-- there is always at least one level of content -->
      <ul>
      {{#each wrapper.content}}
        <li>
          <!-- group or container or pointer -->
          {{#if this.content}}
            <span class="cb-ce-ctrls" data-targets='{{this._targets}}''>
              <i class="cb-ce-ctrls-del fa fa-times"></i>
              <i class="cb-ce-ctrls-grp fa fa-link cb-ce-g-el" style="display:none;"></i>
              <i class="cb-ce-ctrls-grp fa fa-chain-broken cb-ce-g-el-un" style="display:none;"></i>
            </span>
            <span>{{this.name}}</span>
            <ul>
            {{#each this.content}}
              {{#if this.content}}
                <!-- part of group -->
                <span class="cb-ce-ctrls" data-targets='{{this._targets}}''>
                  <i class="cb-ce-ctrls-del fa fa-times"></i>
                </span>
                <span>HM{{this.name}}</span>
                {{#each this.content}}
                  <!-- pointers -->
                  <li>
                    <span class="cb-ce-ctrls" data-targets='{{this._targets}}'>
                      <i class="cb-ce-ctrls-del fa fa-times"></i>                      
                    </span>
                    <span>{{this.name}}</span>
                    <ul>
                    {{#each this.targets}}
                      <li>
                        <span class="cb-ce-ctrls" data-targets='{{this.cid}}'>
                          <i class="cb-ce-ctrls-del fa fa-times"></i> 
                        </span>
                        <span>{{this.xmlid}}</span>
                      </li>
                    {{/each}}
                    </ul>
                  </li>
                {{/each}}
                {{else}}
                <!-- pointers -->
                <li>
                  <span class="cb-ce-ctrls" data-targets='{{this._targets}}'>
                    <i class="cb-ce-ctrls-del fa fa-times"></i>
                  </span>
                  <span>{{this.name}}</span>
                  <ul>
                  {{#each this.targets}}
                    <li>
                      <span class="cb-ce-ctrls" data-targets='{{this.cid}}'>
                        <i class="cb-ce-ctrls-del fa fa-times"></i> 
                      </span>
                      <span>{{this.xmlid}}</span>
                    </li>
                  {{/each}}
                  </ul>
                </li>
              {{/if}}
            {{/each}}                            
            </ul>
          {{else}}
            <span class="cb-ce-ctrls" data-targets='{{this._targets}}'>
              <i class="cb-ce-ctrls-del fa fa-times"></i>
              <i class="cb-ce-ctrls-grp fa fa-link cb-ce-g-el" style="display:none;"></i>
              <i class="cb-ce-ctrls-grp fa fa-chain-broken cb-ce-g-el-un" style="display:none;"></i>
            </span>
            <span>{{this.name}}</span>
            <ul>
              {{#each this.targets}}
                <li>
                  <span class="cb-ce-ctrls" data-targets='{{this.cid}}'>
                    <i class="cb-ce-ctrls-del fa fa-times"></i>
                  </span>
                  <span>{{this.xmlid}}</span>
                </li>
              {{/each}}
            </ul>
          {{/if}}
        </li>
      {{/each}}
      </ul>
    </li>
  </ul>
</div>
<div id="cb-ce-entry-xml">
  <pre class="language-markup"><code class="language-markup">{{xml}}</code></pre>
</div>
`

export default Handlebars.compile(currententrydata_tpl);