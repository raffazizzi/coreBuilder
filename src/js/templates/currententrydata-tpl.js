import * as Handlebars from 'handlebars';

let currententrydata_tpl = `
<div id="cb-ce-entry-items">
  <ul>
    <li>
      <span class="cb-ce-ctrls">
        <i class="cb-ce-ctrls-del fa fa-times" data-targets="all"></i>
      </span>
      <span>{{wrapper.name}}</span>
      <!-- there is always at least one level of content -->
      <ul>
      {{#each wrapper.content}}
        <li>
          <!-- possible group (TODO) -->
          <!-- container or pointer -->
          {{#if this.content}}
            <span class="cb-ce-ctrls">
              <i class="cb-ce-ctrls-del fa fa-times" data-targets="{{this._targets}}"></i>
              <!--<i class="cb-ce-ctrls-grp fa fa-link"></i>-->
            </span>
            <span>{{this.name}}</span>
            <ul>
            {{#each this.content}}
              <!-- pointers -->
              <li>
                <span class="cb-ce-ctrls">
                  <i class="cb-ce-ctrls-del fa fa-times" data-targets="{{this.targets}}"></i>
                </span>
                <span>{{this.name}}</span>
                <ul>
                {{#each this.targets}}
                  <li>
                    <span class="cb-ce-ctrls">
                      <i class="cb-ce-ctrls-del fa fa-times" data-targets="{{this}}"></i>
                    </span>
                    <span>{{this}}</span>
                  </li>
                {{/each}}
                </ul>
              </li>
            {{/each}}                            
            </ul>
          {{else}}
            <span class="cb-ce-ctrls">
              <i class="cb-ce-ctrls-del fa fa-times" data-targets="{{this.targets}}"></i>
              <!--<i class="cb-ce-ctrls-grp fa fa-link"></i>-->
            </span>
            <span>{{this.name}}</span>
            <ul>
              {{#each this.targets}}
                <li>
                  <span class="cb-ce-ctrls">
                    <i class="cb-ce-ctrls-del fa fa-times" data-targets="{{this}}"></i>
                  </span>
                  <span>{{this}}</span>
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