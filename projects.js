'use strict';

var Pagelet = require('bigpipe').Pagelet
  , lexer = require('marked').lexer
  , renderme = require('renderme')
  , path = require('path')
  , fs = require('fs');

//
// Cache sync functions, we don't care about the rest.
//
var write = fs.writeFileSync
  , read = fs.readFileSync;

/**
 * The representation of a single README source.
 *
 * @constructor
 * @param {String} name The name of module who's README.
 * @param {Array} remove README sections that should be removed.
 * @api private
 */
function Source(name, remove) {
  if (!(this instanceof Source)) return new Source(name, remove);

  remove = remove || [];
  var directory = path.dirname(require.resolve(name));

  this.json = require(path.join(directory, 'package.json'));
  this.cache = path.join(__dirname, 'cache', name +'.html');
  this.file = path.join(directory, 'README.md');
  this.content = read(this.file, 'utf-8');
  this.tableofcontents = null;
  this.name = name;

  try { this.html = read(this.cache, 'utf-8'); }
  catch (e) { this.html = ''; }

  this.toc().remove(remove);
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
    if (html) write(source.cache, html);

    fn(undefined, (source.html = html));
  });
};

/**
 * There are parts in this content that we don't really need. We should remove
 * these whole sections. We assume that these sections are separated by headers
 * of their same size.
 *
 * @param {Array} headers Sections that need to be removed
 * @returns {Source}
 * @api private
 */
Source.prototype.remove = function remove(headers) {
  var lines = this.content.split(/\n/g)
    , removal = Array(10).join('@_@-<3>-@_@')
    , indexes = {};

  //
  // First we're going to catalog all the locations/indexes of each header.
  //
  lines.forEach(function each(line, index) {
    line = line.trim();

    if (/^\#+/.test(line)) indexes[line.toLowerCase()] = index;
  });

  headers.forEach(function each(section) {
    section = section.toLowerCase();

    Object.keys(indexes).forEach(function each(header, index, all) {
      if (!~header.indexOf(section)) return;

      var last = indexes[all[index + 1]] || lines.length
        , start = indexes[header];

      while (start < last) {
        //
        // Don't move potential [name]: http://url lines or we will break URLS.
        //
        if (!/^\[\w+\]\:/.test(lines[start])) {
          lines[start] = removal;
        }

        start++;
      }
    });
  });

  this.content = lines.filter(function filter(line) {
    return line !== removal;
  }).join('\n');
};

/**
 * Generate a Table of contents if none is available.
 *
 * @returns {Source}
 * @api private
 */
Source.prototype.toc = function toc() {
  if (this.tableofcontents) return this;

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
  if ('table-of-contents' in ticktoc) ticktoc = ticktoc['table-of-contents'];
  if (Object.keys(ticktoc).length) this.tableofcontents = ticktoc;

  return this;
};

/**
 * Expose a rendered set of our components.
 *
 * @type {Object}
 * @api private
 */
Source.components = {
  'bigpipe': new Source('bigpipe', ['license', 'testing', 'table of contents']),
  'pagelet': new Source('pagelet', ['installation', 'license', 'table of contents']),
  'client': new Source('pipe.js', ['installation', 'license', 'table of contents'])
};

/**
 * A general Source pagelet which will correctly render the README files.
 *
 * @type {Pagelet}
 * @api private
 */
Source.Pagelet = Pagelet.extend({
  view: 'project.ejs',
  css:  'project.styl',

  get: function get(next) {
    var project = Source.components[this.component]
      , pagelet = this;

    project.render(function render(err, html) {
      next(err, {
        README: html,
        project: project
      });
    });
  }
}).on(module);

//
// Things that should be exposed, should be called before `Source.Pagelet.on` so
// we can override the module.exports again.
//
module.exports = Source;
