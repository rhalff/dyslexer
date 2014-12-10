'use strict';

var inherit = require('util').inherits,
  Scope = require('./scope'),
  EventEmitter = require('events').EventEmitter;

/**
 *
 * DysLexer
 *
 *
 * @constructor
 * @param {object} rootScope - The root scope
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

  this.lineNumber = 0;

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

/**
 *
 * Reset
 *
 */
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

  this.lineNumber = 0;

  this.scope = this.rootScope;

  this.track = [this.scope];

};

/**
 *
 * Add Scope
 *
 * Adds a new scope to the lexer.
 *
 * @param {string} scope
 */
DysLexer.prototype.addScope = function(scope) {

  this.level[scope.name] = new scope(this);

};

/**
 *
 * Goes back to the scope we entered from.
 *
 * @param {string} c - Current character
 */
DysLexer.prototype.back = function(c) {
  this.toScope(this.track.pop(), c);
};

/**
 *
 * Switch to another scope
 *
 * @param {string} scope - Scope to switch to
 * @param {string} c     - Current character
 */
DysLexer.prototype.toScope = function(scope, c) {

  // Still useful in debug mode
  //console.log('------ ' + scope + '------');
  this.emit('scopeSwitch', {
    from: this.scope,
    to: scope
  });

  //this.lastScope = this.scope;
  this.track.push(this.scope);

  if (!this.level[scope]) {
    throw Error('Unknown scope: ' + scope);
  }

  // Not used...
  this.level[scope].setParent(
    this.level[this.scope]
  );

  /** check structure of the scope we left */
  this.checkStructure(this.scope);

  /** register the current scope */
  this.scope = scope;

  /** inform what char did the scope */
  this.scoper = c;

  /** char at which this was scoped */
  this.scopeChar = this.current;

  /** reset token list */
  this.level[this.scope].tokens = [];

  /** notify new scope we have entered. */
  this.level[this.scope].onEnter();
};

/**
 *
 *
 *
 */
DysLexer.prototype.next = function() {

  /** take the current character */
  var c = this.chars[this.current];

  /** rebuild the line for debug purposes */
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

  /** if the scope has set it's own tokenEndings.. */
  if(this.level[this.scope].tokenEnding !== undefined) {

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

    /** default behaviour, build the token */
    if(!this.tokenStart) this.tokenStart = this.current;
    this.token += c;

  } else if(
     /** don't act if the scope took control */
     this.level[this.scope].tokenEnding === undefined &&
     this.tokenEnding.indexOf(c) >= 0) {

    this.fireToken();
  }

  // So the same should happen here as onToken, but we got to watch
  // out that we do not have duplicate tokenEnding chars and eol chars.
  if(
    // note, much responsibility for the scope.
    // should take care of it's own ending.
    this.level[this.scope].tokenEnding === undefined &&
    this.eol.indexOf(c) >= 0) {

    // fire last token
    this.fireToken();

    for(var s in this.level) {

      if(this.level.hasOwnProperty(s)) {
        this.level[s].onLineEnd();

        // do not emit lines without tokens. (empty ones)
        if(this.tokens.length) {
          this.emit('lineTokens', this.tokens, this.line, this.lineNumber);

          if(this.sync) {
            // array of tokens per line
            this._tokens.push(this.tokens);
          }

          this.lineNumber++;

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

    /** validate expected token count */
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

    /** remember the current scope */
    var realScope = this.scope;

    /** switch the current scope to root scope */
    this.scope = this.rootScope;

    /**
     * If the scope has set it's own token ending
     * do not run the rootScope 'scanner'
     */
    if(this.level[realScope].tokenEnding !== undefined ||
       /** runs only if the above didn't match, which is important. */
       !this.level[this.rootScope].onToken(this.token)) {

      this.scope = realScope;
      if(this.scope !== this.rootScope) {
        this.level[this.scope].onToken(this.token);
      }

    }

    /** reset token */
    this.token = '';

    /** reset token start */
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

  /** validate the token */
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

  /**
   * Note: this relies on the scopes emitting the tokens back.
   * It does not contain each and every token emitted by this matcher.
   */
  this.lastToken = {
    name: name,
    scope: this.scope,
    value: data,
    scopeChar: this.scopeChar,
    start: this.tokenStart,
    end: this.current
  };

  /** remember token */
  this.tokens.push(this.lastToken);

  this.emit('token', this.lastToken);

  /** push token for this scope */
  this.level[this.scope].tokens.push(this.lastToken);

  /** if we've reached the token count, go back a level (or to root maybe) */
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

  /** notify all scopes we've started */
  for(scope in this.level) {
    if(this.level.hasOwnProperty(scope)) {
      this.level[scope].onLineStart();
    }
  }

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

/**
 *
 * Checks whether the scope returns with an expected structure.
 *
 */
DysLexer.prototype.checkStructure = function(scope) {

  var s = this.level[scope];

  // output to structure
  var tokens = s.tokens.map(function(t) { return t.name; });

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
