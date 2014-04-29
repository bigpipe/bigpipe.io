'use strict';

var BigPipe = require('bigpipe');

BigPipe.Page.extend({
  path: '/',
  view: 'index.ejs',
  pagelets: '../pagelets/'
}).on(module);
