var LeftHandScope = require('./scopes/left'),
  RightHandScope = require('./scopes/right'),
  DataScope = require('./scopes/data'),
  CommentScope = require('./scopes/comment'),
  RootScope = require('./scopes/root');

/**
 *
 * The matcher keeps some states, which are actually
 * pretty generic.
 *
 * TODO: everything that is not data or comment in general
 * is a token when it's devided by space.
 * Not sure what () should be
 *
 */
function Matcher(chars) {

  this.chars = chars;
  this.str = undefined;
  this.current = 0;

  this.scopeChar = 0;

  // Tokens
  this.lastToken = undefined;
  this.tokens = []; // will only be remembered per line/segment

  // defines what currently triggered the
  // scope change. can only be one level deep at the moment,
  // deeper scopes would be fun.
  // it's like nesting within one string.
  // where one character can trigger a total different meaning
  // of what lies ahead.
  this.scoper = undefined;

  this.modes = {
    skip: false,
  };

  // the current scope, in between quotes is the second scope.
  this.lastScope = this.scope = 'RootScope';

  // first level matchers
  this.level = { };

  this.addScope(LeftHandScope);
  this.addScope(CommentScope);
  this.addScope(RootScope);
  this.addScope(DataScope);
  this.addScope(RightHandScope);

  // This is the initial trigger, the rootScope will catch it.
  // it is not counted as a char.
  this.trigger = '\n';

  this.level.RootScope.char[this.trigger]('!');


}
Matcher.prototype.addScope = function(scope) {

   this.level[scope.name] = new scope(this);

};

// goes to last scope
Matcher.prototype.back = function(c) {
  this.toScope(this.lastScope, c);
};


// If back should work reliably, a child scope may
// only call back(), only root scope is allowed to
// call toScope, otherwise lastScope will go beserk
// Ok, doesn't matter just know what you are doing.
// LeftHand e.g. also uses toScope to go up.
// So toScope can only be used to go up.
Matcher.prototype.toScope = function(scope, c) {
  console.log('------ ' + scope + '------');
  this.lastScope = this.scope;

  // register the current scope
  this.scope = scope;

  // inform what char did the scope
  this.scoper = c;

  // char at which this was scoped
  this.scopeChar = this.current;
};

Matcher.prototype.next = function() {

  var c = this.chars[this.current], r;

  console.log(
    this.scope,  ':',
    c,
    this.level['RootScope'].count // just for debug
   // this.level[1].count  // just for debug
  );

  // I think the space logic should be overhere.
  // maybe just indicate token begin. and token end.
  // determined by new line or space.
  // scopes will not receive space.
  // err however, the dataScope should receive space.
  // so, add a preserveSpace option.

  if(!this.modes.skip) {
    if(this.level[this.scope].char[c]) {

      this.level[this.scope].touchy = true;

      console.log(this.level[this.scope].constructor.name);

      r = this.level[this.scope].char[c](c);
      console.log('field', this.level[this.scope].field);

      this.level[this.scope].touchy = false;

      if(r) this.str += r;
    }
  } else {
    console.log('skip');
  }

  this.current++;
};

Matcher.prototype.toString = function() {
  return this.str;
};

Matcher.prototype.emit = function(t) {

  // TODO: +1 is a bug, current is updated too late.
  // happens with forward search I guess. you match the next
  // and current is still, well, current...
  // so the matcher should advance the pointer..
  // but the loop will not take that into account..
  var data = this.chars.slice(this.scopeChar, this.current + 1);

  // data is not remembered in the token.
  this.lastToken = {
    start: this.scopeChar, // wrong name
    name: t,
    end: this.current
  };

  this.tokens.push(this.lastToken);

  console.log('TOKEN "', t, '"', data.join(''));
};

module.exports = Matcher;
