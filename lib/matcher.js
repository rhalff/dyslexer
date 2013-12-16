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
  this.lastScope = this.scope = 'RootScope';

  this.addScope(LeftHandScope);
  this.addScope(CommentScope);
  this.addScope(RootScope);
  this.addScope(DataScope);
  this.addScope(RightHandScope);

}
Matcher.prototype.addScope = function(scope) {

  this.level[scope.name] = new scope(this);
  this.level[scope.name].onLineStart();

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

  // re-enter: reset token count
  this.level[this.scope].tokenCount = 0;

  // notify new scope we have entered.
  this.level[this.scope].onEnter();
};

Matcher.prototype.next = function() {

  var c = this.chars[this.current], r;

  console.log(this.scope, ':', c);

  // err however, the datascope should receive space.
  // so, add a preserveSpace option.
  if(this.level[this.scope].char[c]) {

    this.level[this.scope].touchy = true;

    console.log(this.level[this.scope].constructor.name);

    this.level[this.scope].char[c](c);

    this.level[this.scope].touchy = false;

  } else if(this.level[this.scope].char['**']) {
    // '**' will run whenever there is not already a match
    this.level[this.scope].char['**'](c);
  }

  // build the token
  if(this.level[this.scope].tokenEnding.indexOf(c) === -1 &&
    this.eol.indexOf(c) === -1) {
    this.token += c;
  }

  // check end of token
  // ok, the escape doesn't work, it is noticed by data
  // however, overhere we do not take it into account...
  if(this.level[this.scope].tokenEnding.indexOf(c) >= 0 &&
     !this.isEscaped() &&
    this.token) {

    // increase token count for this scope
    this.level[this.scope].tokenCount++;

    // delegate token to the current scope
    this.fireToken();

    // reset token
    this.token = '';
  }

  // So the same should happen here as onToken, but we got to watch
  // out that we do not have duplicate tokenEnding chars and eol chars.
  if(this.eol.indexOf(c) >= 0) {

    // todo, this is a bit buggy, see above in tokenEnding.
    // we rely on this.token being reset.
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

      // root should always read. and stay in control.
      // it can check the current scope whether it should act or not.
      // by default root will watch for ->
      //
      // The only solution is to give root controller ability.
      // It can regain control.
      //
      // A bit disturbing is the fact it continues anyway.
      // That's also why it's important to have a controller
      // gaining control.
      //
      // sooo, just make sure root is always called
      // and make root manditory, root could also be merged
      // into this matcher, leaving only the real scopes.

      // delegate token to the current scope
      this.fireToken();

      this.token = '';

    }

    for(var s in this.level) {
      this.level[s].onLineEnd();

      // reset token count
      this.level[s].tokenCount = 0;

      // reset generic stuff from the scope.
      this.level[s].onLineStart();
    }
  }

  this.current++;

};

Matcher.prototype.fireToken = function() {

  if(this.scope !== 'RootScope') {
    this.level[this.scope].onToken(this.token);
  }

  // alway pass token to rootscope
  this.level['RootScope'].onToken(this.token);

};

Matcher.prototype.isEscaped = function() {

  // leave room to escape the choice.
  if(this.level[this.scope].escape) {

     console.log('YEP HAS  ESCAPE',
       this.level[this.scope].escape,
       this.chars[this.current - 1]
     );

    if(this.chars[this.current - 1] === '\\') {
      console.log('YEPPPP escaped');
      return true;
    }

  }

  return false;
}

Matcher.prototype.emit = function(name, data) {

  // TODO: +1 is a bug, current is updated too late.
  // happens with forward search I guess. you match the next
  // and current is still, well, current...
  // so the matcher should advance the pointer..
  // but the loop will not take that into account..
  //var data = this.chars.slice(this.scopeChar, this.current + 1);
  console.log('EMIT', name, data);

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
    name: name, // should be token name.
    data: data,
    start: this.scopeChar, // wrong name
    end: this.current
  };

  // push token
  this.tokens.push(this.lastToken);

  // if we've reached the token count, go back a level (or to root maybe)
  if(this.level[this.scope].tokensExpected ===
    this.level[this.scope].tokenCount) {
    console.log('YEAYYY');
    // I hope no recursion or other weird behavior within next()
    // ok this works but is a bit ugly...
    this.scope = 'RootScope';
  }

};

module.exports = Matcher;
