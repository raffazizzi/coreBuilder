// jQuery and jquery-xpath must be required with old syntax for the time being.
var $ = global.jQuery = require('jquery');
require('../../node_modules/jquery-xpath/jquery.xpath');

import * as Backbone from 'backbone';
import CoreBuilder from './views/app-view.js';

Backbone.history.start({ pushState: true, root: '/' });

$(() => {
    new CoreBuilder({el:"#wrapper"});
});