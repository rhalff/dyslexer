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

  this.token = '';

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

  // notify new scope we have entered.
  this.level[this.scope].onEnter();
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
  //
  // ok right now it is char[c]();
  // grr, we still need to read by char,
  // but overhere we should detect the tokens.
  // totally different concept it seems.
  //
  // it's different, c === <char> is a direct match.
  // you either catch it or not.
  //
  // regexp match, you will need to iterate all matches each time.
  // what also can be done is have a wildcard for any char.
  // So we give it token start and end, but still every scope
  // is able to check each character.
  // token_start >>> process (found : ) >>> token end
  // Then we know what it is we have.

  if(!this.modes.skip) {
    if(this.level[this.scope].char[c]) {

      this.level[this.scope].touchy = true;

      console.log(this.level[this.scope].constructor.name);

      // todo, r is not needed, not return also..
      r = this.level[this.scope].char[c](c);
      console.log('field', this.level[this.scope].field);

      this.level[this.scope].touchy = false;


      if(r) this.str += r;
    }

    // build the token
    if(this.level[this.scope].tokenEnding.indexOf(c) === -1) {
      this.token += c;
    }

  } else {
    console.log('skip');
  }

  // check end of token
  // the next one receives the token, so this is wrong.
  // but, this is because we also switch from within the scope.
  // So what really has to determine scope switchin is
  // decided onToken.
  if(this.level[this.scope].tokenEnding.indexOf(c) >= 0 && this.token) {

    // notify the token
    this.level[this.scope].onToken(this.token);

    // data is not remembered in the token.
    this.lastToken = {
      start: this.scopeChar, // wrong name
      name: undefined, // should be token name.
      end: this.current
    };

    // OK, to bad, from within the scope we knew the token name
    // because we just told it so with emit, so have to reimplement that.
    this.tokens.push(this.lastToken);

    // push token

    // reset token
    this.token = '';
  }

  // notify the token, hm comma is also.
  // that's now handled correctly.
  // but only because I handle it in the rootScope.
  // so overhere , will not be detected as token ender..
  // grr.. also within the scope of comments al of these
  // are not token enders.. only \n is.
  //
  // we could add default enders to the scope.
  // comment scope will only have \n as ender
  // data scope will have a quote as ender.
  // however, we do not know before hand whether
  // it is a ' or a "
  //
  // Anyway, if we have that in place this loop
  // can determine when a token ends.
  //
  // With quotes it ends with quotes, this is also how we
  // read, it does not end because there is a space behind it.
  // So logic wise this also would be the most correct.
  //
  // The switch to data mode is _on_ quote, does the datascope
  // also have knowledge of this quote?
  //
  // It doesn't but it has access to matcher.scoper, which contains
  // it.
  //
  // So how to use it to fill token_enders?
  // We could do this on token start. or a better definition
  // is on enter, because we might be in the middle of a token
  // when entering this scope. ok, this on enter is easy.
  // it can be added to toScope();
  /*
  var token_enders = ['\n','\t',' ']; // etc..
  if(c === ' ') {
    this.token = ...
  }
  // this.level[this.scope].onToken(token);
  */

  this.current++;
};

Matcher.prototype.toString = function() {
  return this.str;
};

Matcher.prototype.emit = function(t, data) {

  // TODO: +1 is a bug, current is updated too late.
  // happens with forward search I guess. you match the next
  // and current is still, well, current...
  // so the matcher should advance the pointer..
  // but the loop will not take that into account..
  //var data = this.chars.slice(this.scopeChar, this.current + 1);
  console.log('EMIT', t, data);

};

module.exports = Matcher;
