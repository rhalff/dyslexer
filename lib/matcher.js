var LeftHandScope = require('./scopes/left'),
  RightHandScope = require('./scopes/right'),
  DataScope = require('./scopes/data'),
  CommentScope = require('./scopes/comment'),
  RootScope = require('./scopes/root');
  util = require('util');
  EventEmitter = require('events').EventEmitter;

/**
 *
 * The matcher keeps some states, which are actually
 * pretty generic.
 *
 * TODO: everything that is not data or comment in general
 * is a token when it's devided by space.
 *
 */
function Matcher(chars) {

  this.chars = chars;
  this.current = 0;

  // not totally correct, ah well..
  // also do not count \r as character, it has 2 chars
  // for eol.
  // TODO: should override comma as custom,
  // not as default overhere
  this.eol = ['\n','\r', ','];

  this.scopeChar = 0;

  // Tokens
  this.lastToken = undefined;
  this.tokens = []; // will only be remembered per line/segment

  this.token = '';

  // the last character that triggered a scope change.
  this.scoper = undefined;

  // first level matchers
  this.level = { };


  // Hm, ok how to specify the root scope
  // I won't to move these addScope's out of here.
  // the current scope, in between quotes is the second scope.
  //this.lastScope = this.scope = 'RootScope';
  this.scope = 'RootScope';

  // keep track of where we are,
  // with possibility to go back
  // bit wild but works.
  this.track = [this.scope];

  // For now Root is a fixed scope.
  // One that can be configured though.

  this.addScope(LeftHandScope);
  this.addScope(CommentScope);
  this.addScope(RootScope);
  this.addScope(DataScope);
  this.addScope(RightHandScope);

}

util.inherits(Matcher, EventEmitter);

Matcher.prototype.addScope = function(scope) {

  this.level[scope.name] = new scope(this);
  this.level[scope.name].onLineStart();

};

// goes to last scope
Matcher.prototype.back = function(c) {
  //this.toScope(this.lastScope, c);
  this.toScope(this.track.pop(), c);
};


// If back should work reliably, a child scope may
// only call back(), only root scope is allowed to
// call toScope, otherwise lastScope will go beserk
// Ok, doesn't matter just know what you are doing.
// LeftHand e.g. also uses toScope to go up.
// So toScope can only be used to go up.
Matcher.prototype.toScope = function(scope, c) {

  // Still useful in debug mode
  //console.log('------ ' + scope + '------');

  //this.lastScope = this.scope;
  this.track.push(this.scope);

  // to emit from the parent
  this.level[scope].setParent(
    this.level[this.scope]
  );

  // register the current scope
  this.scope = scope;

  // inform what char did the scope
  this.scoper = c;

  // char at which this was scoped
  this.scopeChar = this.current;

  // re-enter: reset token count
  this.level[this.scope].tokenCount = 0;

  // notify new scope we have entered.
  this.level[this.scope].onEnter();
};

Matcher.prototype.next = function() {

  var c = this.chars[this.current], r;

  // debug
  // console.log(this.scope, ':', c);

  // err however, the datascope should receive space.
  // so, add a preserveSpace option.
  if(this.level[this.scope].char[c]) {

    // debug
    // console.log(this.level[this.scope].constructor.name);

    this.level[this.scope].char[c](c);

  } else if(this.level[this.scope].char['**']) {
    // '**' will run whenever there is not already a match
    this.level[this.scope].char['**'](c);
  }

  // build the token
  if(this.level[this.scope].tokenEnding.indexOf(c) === -1 &&
    this.eol.indexOf(c) === -1) {
    this.token += c;
  }

  if(this.level[this.scope].tokenEnding.indexOf(c) >= 0 &&
     !this.isEscaped()
     ) {

    // delegate token to the current scope
    this.fireToken();
  }

  // So the same should happen here as onToken, but we got to watch
  // out that we do not have duplicate tokenEnding chars and eol chars.
  if(this.eol.indexOf(c) >= 0) {

    // fire last token
    this.fireToken();

    for(var s in this.level) {
      this.level[s].onLineEnd();

      // reset token count
      this.level[s].tokenCount = 0;

      // do not emit lines without tokens. (empty ones)
      if(this.tokens.length) {
        this.emit('lineTokens', this.tokens);
      }

      this.tokens = [];

      // reset generic stuff from the scope.
      this.level[s].onLineStart();
    }
  }

  this.current++;

};

Matcher.prototype.fireToken = function() {

  if(this.token) {

    // increase token count for this scope
    this.level[this.scope].tokenCount++;

    if(typeof this.level[this.scope].tokensExpected === 'undefined') {
      throw new Error("tokensExpected is not set for " + this.scope);
    }

    if(this.level[this.scope].tokensExpected <
       this.level[this.scope].tokenCount) {
       throw new Error([
         "Unexpected token count for",
         this.scope
       ].join(''));
    }

    if(this.scope !== 'RootScope') {
      this.level[this.scope].onToken(this.token);
    }

    // alway pass token to rootscope
    this.level['RootScope'].onToken(this.token);

    // reset token
    this.token = '';

  }

};

Matcher.prototype.isEscaped = function() {

  // leave room to escape the choice.
  if(this.level[this.scope].escape) {

    if(this.chars[this.current - 1] === '\\') {
      return true;
    }

  }

  return false;
}

Matcher.prototype.present = function(name, data) {

  // still useful in debug mode
  // console.log('EMIT', name, data);

  // maybe force validation to be present.
  if(this.level[this.scope].validate) {
    var reg = this.level[this.scope].validate[name];
    if(typeof reg === 'string') reg = new RegExp(reg); // ...
    if(reg && !reg.test(data)) {
      throw new Error([
        'Invalid',
        name,
        "token does not match",
        reg.toString(),
        "\n\n\t",
        data,
        "\n"
        ].join(' ')
      );
    }
  }

  // Note: this relies on the scopes emitting the tokens back.
  // It does not contain each and every token emitted
  // by this matcher.
  this.lastToken = {
    name: name,
    scope: this.scope,
    data: data,
    start: this.scopeChar,
    end: this.current
  };

  // push token
  this.tokens.push(this.lastToken);

  // if we've reached the token count, go back a level (or to root maybe)
  if(this.level[this.scope].tokensExpected ===
    this.level[this.scope].tokenCount) {
    // ok this works but is a bit ugly...
    this.scope = 'RootScope';
  }

};

module.exports = Matcher;
