'use strict';

var projects = require('../../projects');

require('bigpipe').Pagelet.extend({
  view: 'view.ejs',
  css:  'css.styl',

  get: function get(next) {
    next(undefined, {
      components: projects.components
    });
  }
}).on(module);
