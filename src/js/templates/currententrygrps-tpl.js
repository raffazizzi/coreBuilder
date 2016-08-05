import * as Handlebars from 'handlebars';

// TODO make "dropup" and deal with scroll issue.

let currententrygrps_tpl = `
<a class="dropdown-item" id="cb-ce-g-new" href="#">New group</a>
{{#each this}}
<a class="dropdown-item cb-ce-g {{#if this.selected}}cb-selected{{/if}}" data-pos="{{this.number}}" href="#">Group {{this.number}}</a>
{{/each}}
`

export default Handlebars.compile(currententrygrps_tpl);