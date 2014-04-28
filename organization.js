'use strict';

var read = require('fs').readFileSync
  , lexer = require('marked').lexer
  , renderme = require('renderme')
  , path = require('path');

/**
 * The representation of a single README source.
 *
 * @constructor
 * @param {String} name The name of module who's README.
 * @api private
 */
function Source(name) {
  var directory = path.dirname(require.resolve(name));

  this.json = require(path.join(directory, 'package.json'));
  this.file = path.join(directory, 'README.md');
  this.content = read(this.file, 'utf-8');
  this.tableofcontents = null;
  this.name = name;
  this.html = '';
}

/**
 * Render the markdown file.
 *
 * @param {Function} fn
 * @api private
 */
Source.prototype.render = function render(fn) {
  if (this.html) return fn(undefined, this.html);

  var source = this;

  renderme({
    renderFilename: this.file,
    readme: this.content
  }, {
    limit: Infinity,
    github: {
      user: 'bigpipe',
      repo: this.name
    }
  }, function rendered(err, html) {
    if (err) return fn(err);

    fn(undefined, (source.html = html));
  });
};

/**
 * Generate a Table of contents if none is available.
 *
 * @param {Function} fn
 * @api private
 */
Source.prototype.toc = function toc(fn) {
  if (this.tableofcontents) return fn(undefined, this.tableofcontents);

  var navigation = lexer(this.content).filter(function filter(token) {
    return token.type === 'heading' && (token.depth === 2 || token.depth === 3);
  });

  var ticktoc = {}
    , currently;

  navigation.forEach(function forEach(token) {
    var name = token.text
      , id;

    id = name.replace(/[\.|\#]/g, '')     // Remove dots and others.
             .replace(/[^\w]+/g, '-')     // All none-words are now -'s>
             .replace(/[\-]+$/, '')       // Remove suffixed -'s.
             .toLowerCase();              // Always lowercase things.

    if (2 === token.depth) {
      ticktoc[id] = { name: name };
      currently = id;
    } else if (ticktoc[currently]) {
      (ticktoc[currently].sections = ticktoc[currently].sections || []).push({
        name: name,
        id: id
      });
    }
  });

  //
  // If we an table of contents, we should just use that.
  //
  if ('table-of-contents' in ticktoc) {
    ticktoc = ticktoc['table-of-contents'];
  }

  fn(undefined, (this.tableofcontents = ticktoc));
};

/**
 * Expose a rendered set of our components.
 *
 * @type {Object}
 * @api private
 */
Source.components = {
  'bigpipe': new Source('bigpipe'),
  'pagelet': new Source('pagelet'),
  'pipe.js': new Source('pipe.js')
};

//
// Things.
//
module.exports = Source;
