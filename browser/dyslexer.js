
/**
 * Require the given path.
 *
 * @param {String} path
 * @return {Object} exports
 * @api public
 */

function require(path, parent, orig) {
  var resolved = require.resolve(path);

  // lookup failed
  if (null == resolved) {
    orig = orig || path;
    parent = parent || 'root';
    var err = new Error('Failed to require "' + orig + '" from "' + parent + '"');
    err.path = orig;
    err.parent = parent;
    err.require = true;
    throw err;
  }

  var module = require.modules[resolved];

  // perform real require()
  // by invoking the module's
  // registered function
  if (!module._resolving && !module.exports) {
    var mod = {};
    mod.exports = {};
    mod.client = mod.component = true;
    module._resolving = true;
    module.call(this, mod.exports, require.relative(resolved), mod);
    delete module._resolving;
    module.exports = mod.exports;
  }

  return module.exports;
}

/**
 * Registered modules.
 */

require.modules = {};

/**
 * Registered aliases.
 */

require.aliases = {};

/**
 * Resolve `path`.
 *
 * Lookup:
 *
 *   - PATH/index.js
 *   - PATH.js
 *   - PATH
 *
 * @param {String} path
 * @return {String} path or null
 * @api private
 */

require.resolve = function(path) {
  if (path.charAt(0) === '/') path = path.slice(1);

  var paths = [
    path,
    path + '.js',
    path + '.json',
    path + '/index.js',
    path + '/index.json'
  ];

  for (var i = 0; i < paths.length; i++) {
    var path = paths[i];
    if (require.modules.hasOwnProperty(path)) return path;
    if (require.aliases.hasOwnProperty(path)) return require.aliases[path];
  }
};

/**
 * Normalize `path` relative to the current path.
 *
 * @param {String} curr
 * @param {String} path
 * @return {String}
 * @api private
 */

require.normalize = function(curr, path) {
  var segs = [];

  if ('.' != path.charAt(0)) return path;

  curr = curr.split('/');
  path = path.split('/');

  for (var i = 0; i < path.length; ++i) {
    if ('..' == path[i]) {
      curr.pop();
    } else if ('.' != path[i] && '' != path[i]) {
      segs.push(path[i]);
    }
  }

  return curr.concat(segs).join('/');
};

/**
 * Register module at `path` with callback `definition`.
 *
 * @param {String} path
 * @param {Function} definition
 * @api private
 */

require.register = function(path, definition) {
  require.modules[path] = definition;
};

/**
 * Alias a module definition.
 *
 * @param {String} from
 * @param {String} to
 * @api private
 */

require.alias = function(from, to) {
  if (!require.modules.hasOwnProperty(from)) {
    throw new Error('Failed to alias "' + from + '", it does not exist');
  }
  require.aliases[to] = from;
};

/**
 * Return a require function relative to the `parent` path.
 *
 * @param {String} parent
 * @return {Function}
 * @api private
 */

require.relative = function(parent) {
  var p = require.normalize(parent, '..');

  /**
   * lastIndexOf helper.
   */

  function lastIndexOf(arr, obj) {
    var i = arr.length;
    while (i--) {
      if (arr[i] === obj) return i;
    }
    return -1;
  }

  /**
   * The relative require() itself.
   */

  function localRequire(path) {
    var resolved = localRequire.resolve(path);
    return require(resolved, parent, path);
  }

  /**
   * Resolve relative to the parent.
   */

  localRequire.resolve = function(path) {
    var c = path.charAt(0);
    if ('/' == c) return path.slice(1);
    if ('.' == c) return require.normalize(p, path);

    // resolve deps by returning
    // the dep in the nearest "deps"
    // directory
    var segs = parent.split('/');
    var i = lastIndexOf(segs, 'deps') + 1;
    if (!i) i = 0;
    path = segs.slice(0, i + 1).join('/') + '/deps/' + path;
    return path;
  };

  /**
   * Check if module is defined at `path`.
   */

  localRequire.exists = function(path) {
    return require.modules.hasOwnProperty(localRequire.resolve(path));
  };

  return localRequire;
};
require.register("dyslexer/lib/dyslexer.js", function(exports, require, module){
'use strict';

var inherit = require('util').inherits,
  Scope = require('./scope'),
  EventEmitter = require('events').EventEmitter;

/**
 *
 * The DysLexer keeps some states, which are actually pretty generic.
 *
 */
function DysLexer(rootScope) {

  this.chars = {};
  this.current = 0;

  // not totally correct, ah well..
  // also do not count \r as character, it has 2 chars
  // for eol.
  // TODO: should override comma as custom,
  // not as default overhere
  this.eol = ['\n','\r', ','];

  this.scopeChar = 0;

  // default token endings
  // a scope can overwrite this temporarily
  this.tokenEnding = ['\n','\t',' '];

  // Tokens
  this.lastToken = undefined;

  // token cache
  this.tokens = [];

  // will remember all tokens in sync mode.
  this._tokens = [];

  // char at which the current token started
  this.tokenStart = 0;

  this.token = '';

  // the last character that triggered a scope change.
  this.scoper = undefined;

  // char at which the current scope started
  this.scopeStart = 0;

  // first level matchers
  this.level = { };

  // only rebuild for logging
  this.line = '';

  this.scope = this.rootScope = rootScope;

  // keep track of where we are,
  // with possibility to go back
  // bit wild but works.
  this.track = [this.scope];

}

inherit(DysLexer, EventEmitter);

DysLexer.Scope = Scope;

DysLexer.prototype.reset = function() {

  this.chars = {};
  this.current = 0;

  this.scopeChar = 0;

  // Tokens
  this.lastToken = undefined;

  // will only be remembered per line/segment
  this.tokens = [];

  // will remember all tokens in sync mode.
  this._tokens = [];

  this.token = '';

  // the last character that triggered a scope change.
  this.scoper = undefined;

  // line is rebuild for logging
  this.line = '';

  this.scope = this.rootScope;

  this.track = [this.scope];

};

DysLexer.prototype.addScope = function(scope) {

  this.level[scope.name] = new scope(this);

};

// goes to last scope
DysLexer.prototype.back = function(c) {
  this.toScope(this.track.pop(), c);
};

DysLexer.prototype.toScope = function(scope, c) {

  // Still useful in debug mode
  //console.log('------ ' + scope + '------');
  this.emit('scopeSwitch', {
    from: this.scope,
    to: scope
  });

  //this.lastScope = this.scope;
  this.track.push(this.scope);

  // Not used...
  this.level[scope].setParent(
    this.level[this.scope]
  );

  // check structure of the scope we left
  this.checkStructure(this.scope);

  // register the current scope
  this.scope = scope;

  // inform what char did the scope
  this.scoper = c;

  // char at which this was scoped
  this.scopeChar = this.current;

  // reset token list
  this.level[this.scope].tokens = [];

  // notify new scope we have entered.
  this.level[this.scope].onEnter();
};

DysLexer.prototype.next = function() {

  var c = this.chars[this.current];

  this.line += c;

  // debug
  // console.log(this.scope, ':', c);

  if(this.level[this.scope].rules[c]) {

    // this can cause weird behaviour if the rule itself
    // is redirecting the scope, which happens..
    // it means within this function this.scope is switched...
    this.level[this.scope].rules[c](c);

  } else if(this.level[this.scope].rules['**']) {
    // '**' will run whenever there is not already a match
    this.level[this.scope].rules['**'](c);
  }
  // Ok the above character matching could have switched the scope
  // it's actually the only job the character matching has...
  // but that character matching has a purpose.
  // however because we have switched scopes at _this_ exact point
  // the character will be re-considered by the other scope
  // that's the code following below.

  // it the scope has set it's own tokenEndings..
  if(this.level[this.scope].tokenEnding.length) {

    if(!this.tokenStart) this.tokenStart = this.current;
    this.token += c;

    if(this.level[this.scope].tokenEnding.indexOf(c) >= 0 &&
     // trick to catch the first ' which is not escaped
     // it's the first
     // Ok, this makes a big difference.
     // if we save the token in the other scope
     // this one will never happen.
     // right hand is set with tokenEnding
     // where left hand is set with the character matchin
     // that's not so good.
     // so switching should be done from within
     // the character matching I think.
     // that will go ok, I hope.
     this.token.length > 1 &&
    !this.isEscaped()) {

      this.fireToken();

    }

  } else if(
    this.tokenEnding.indexOf(c) === -1 &&
    this.eol.indexOf(c) === -1) {

    // default behaviour, build the token
    if(!this.tokenStart) this.tokenStart = this.current;
    this.token += c;

  } else if(
     // don't act if the scope took control
     this.level[this.scope].tokenEnding.length === 0 &&
     this.tokenEnding.indexOf(c) >= 0) {

    this.fireToken();
  }

  // So the same should happen here as onToken, but we got to watch
  // out that we do not have duplicate tokenEnding chars and eol chars.
  if(
    // note, much responsibility for the scope.
    // should take care of it's own ending.
    !this.level[this.scope].tokenEnding.length &&
    this.eol.indexOf(c) >= 0) {

    // fire last token
    this.fireToken();

    for(var s in this.level) {

      if(this.level.hasOwnProperty(s)) {
        this.level[s].onLineEnd();

        // do not emit lines without tokens. (empty ones)
        if(this.tokens.length) {
          this.emit('lineTokens', this.tokens, this.line);

          if(this.sync) {
            // array of tokens per line
            this._tokens.push(this.tokens);
          }

        }

        this.tokens = [];

        this.line = '';

        // reset generic stuff from the scope.
        this.level[s].onLineStart();
      }
    }
  }

  this.current++;

};

DysLexer.prototype.fireToken = function() {

  if(this.token) {

    if(typeof this.level[this.scope].tokensExpected === 'undefined') {
      throw new Error('tokensExpected is not set for ' + this.scope);
    }

    // ok how to solve that chaining problem.
    if(this.level[this.scope].tokensExpected <
       this.level[this.scope].tokens.length) {
      throw new Error([
        'Unexpected token count for',
        this.scope,
        'expected',
        this.level[this.scope].tokensExpected,
        'instead of',
        this.level[this.scope].tokens.length,
        'tokens\n\n\t',
        JSON.stringify(this.level[this.scope].tokens, null, 2),
        '\n'
      ].join(' '));
    }

    var realScope = this.scope;

    // Really switch this scope to root scope
    this.scope = this.rootScope;

    // If the scope has set it's own token ending
    // do not run the rootScope 'scanner' if that's the case
    if(this.level[realScope].tokenEnding.length ||
       // runs only if the above didn't match, which is important.
       !this.level[this.rootScope].onToken(this.token)) {

      this.scope = realScope;
      if(this.scope !== this.rootScope) {
        this.level[this.scope].onToken(this.token);
      }

    }

    // reset token
    this.token = '';

    // reset token start
    this.tokenStart = undefined;

  }

};

DysLexer.prototype.isEscaped = function() {

  // leave room to escape the choice.
  if(this.level[this.scope].escape) {

    if(this.chars[this.current - 1] === '\\') {
      return true;
    }

  }

  return false;
};

// TODO: should check whether the token was handled
// or at least make sure that when we fire a token
// it is in sync with what we got presented back.
// This way we can detect unhandled tokens.
DysLexer.prototype.present = function(name, data) {

  // maybe force validation to be present.
  if(this.level[this.scope].validate) {
    var reg = this.level[this.scope].validate[name];
    if(typeof reg === 'string') reg = new RegExp(reg); // ...
    if(reg && !reg.test(data)) {
      throw new Error([
        'Invalid',
        name,
        'token does not match',
        reg.toString(),
        '\n\n\t',
        data,
        '\n'
      ].join(' '));
    }
  }

  // Note: this relies on the scopes emitting the tokens back.
  // It does not contain each and every token emitted by this matcher.
  this.lastToken = {
    name: name,
    scope: this.scope,
    value: data,
    scopeChar: this.scopeChar,
    start: this.tokenStart,
    end: this.current
  };

  // remember token
  this.tokens.push(this.lastToken);

  this.emit('token', this.lastToken);

  // push token for this scope
  this.level[this.scope].tokens.push(this.lastToken);

  // if we've reached the token count, go back a level (or to root maybe)
  if(this.level[this.scope].tokensExpected ===
    this.level[this.scope].tokens.length) {

    // ok this works but is a bit ugly...
    this.toScope(this.rootScope);
  }

};

function compare(array1, array2) {

  var i, l;

  // if the other array is a falsy value, return
  if (!array2) return false;

  // compare lengths - can save a lot of time
  if (array1.length !== array2.length) return false;

  for (i = 0, l = array1.length; i < l; i++) {
    // Check if we have nested arrays
    if (array1[i] instanceof Array && array2[i] instanceof Array) {
      // recurse into the nested arrays
      if (!array1[i].compare(array2[i])) return false;
    } else if (array1[i] !== array2[i]) {
      return false;
    }
  }
  return true;
}

DysLexer.prototype.start = function(str, sync) {
  var i, scope;

  // TODO: temp fix
  str = str + '\n';

  // will remember all _tokens
  this.sync = sync;

  this.chars = str.split('');

  if(!this.rootScope) {
    throw new Error('Initial Root Scope required');
  }

  // notify all, we've started
  for(scope in this.level) {
    if(this.level.hasOwnProperty(scope)) {
      this.level[scope].onLineStart();
    }
  }

  // TODO: this way next makes no sense... :-)
  for(i = 0; i < this.chars.length; i++) {
    this.next();
  }

  this.emit('end');

  return (sync) ? this._tokens : null;

};

DysLexer.prototype.readChunk = function(str) {

  this.reset();
  this.start(str.toString());

};

// TODO: I want also to check partial structure.
// per token length, now only the end result is checked.
// not during token building for one scope.
DysLexer.prototype.checkStructure = function(scope) {

  var s = this.level[scope];

  // output to structure
  var tokens = s.tokens.map(function(t) { return t.name; });

  // nice, left hand is never checked..
  // because it's always empty, still true?
  if(tokens.length) {

    // Check if it matches any of the structures.
    if(s.structure.length) {

      var match = false;
      for(var str in s.structure) {
        if(compare(tokens, s.structure[str])) {
          match = true;
          break;
        }
      }
      if(!match) {
        throw new Error([
          'Structure mismatch for',
          scope,
          JSON.stringify(tokens),
          'did not match any of',
          JSON.stringify(s.structure),
          '\n\n\t',
          JSON.stringify(s.tokens)
        ].join(' '));
      }

      this.emit('structure', {
        scope: scope,
        tokens: tokens
      });

    }

  }

};

module.exports = DysLexer;

});
require.register("dyslexer/lib/scope.js", function(exports, require, module){
'use strict';

function Scope(lexer) {

  this.lexer = lexer;

  // default token endings
  // a scope can overwrite this.
  this.tokenEnding = [];

  // If this is set, the parser will throw an error
  // if there are more tokens, within the current scope.
  this.tokensExpected = undefined;

  // ttokens processed by this scope on the current line
  // automatically reset on each line start
  this.tokens = [];

  // check for escaped token endings
  this.escape = false;

  // basic structure checking
  // if empty no structure checking is done.
  this.structure = [];

  // this could be made generic for switchers.
  // switchers are only valid until the next char.
  this.rules = {};

  this.setup();
  this.loadRules();

}

Scope.prototype.onLineEnd   = function() { };
Scope.prototype.onLineStart = function() { };
Scope.prototype.onEnter     = function() { };
Scope.prototype.setup       = function() { };

Scope.prototype.parent = function() {

  return this._parent;

};

Scope.prototype.setParent = function(parent) {
  this._parent = parent;
};

Scope.prototype.loadRules = function() {

  var alias;

  for(alias in this.alias) {
    // create an alias, the function is reused.
    // so the char comming in can now be of multiple types.
    // e.g. both ' or ", or
    //      both - and > to detect ->
    if(this.alias.hasOwnProperty(alias)) {
      this.rules[alias] = this.rules[this.alias[alias]];
    }
  }

};

module.exports = Scope;

});
require.alias("dyslexer/lib/dyslexer.js", "dyslexer/index.js");