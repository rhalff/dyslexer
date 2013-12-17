var util = require('util'),
  assert = require('assert'),
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

  // only rebuild for logging
  this.line = '';


  // Hm, ok how to specify the root scope
  // I won't to move these addScope's out of here.
  // the current scope, in between quotes is the second scope.
  //this.lastScope = this.scope = 'RootScope';
  this.scope = undefined;

  this.rootScope = undefined;

  // keep track of where we are,
  // with possibility to go back
  // bit wild but works.
  this.track = [this.scope];

}

util.inherits(Matcher, EventEmitter);

Matcher.prototype.addScope = function(scope) {

  this.level[scope.name] = new scope(this);

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
  this.emit('scopeSwitch', {
    from: this.scope,
    to: scope
  });

  //this.lastScope = this.scope;
  this.track.push(this.scope);

  // to emit from the parent
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

  // reset token list, not that this kinda
  this.level[this.scope].tokens = [];

  // notify new scope we have entered.
  this.level[this.scope].onEnter();
};

Matcher.prototype.next = function() {

  var c = this.chars[this.current], r;

  this.line += c;
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

      // do not emit lines without tokens. (empty ones)
      if(this.tokens.length) {
        this.emit('lineTokens', this.tokens, this.line);
      }

      this.tokens = [];

      this.line = '';

      // reset generic stuff from the scope.
      this.level[s].onLineStart();
    }
  }

  this.current++;

};

Matcher.prototype.fireToken = function() {

  if(this.token) {

    if(typeof this.level[this.scope].tokensExpected === 'undefined') {
      throw new Error("tokensExpected is not set for " + this.scope);
    }

    // ok how to solve that chaining problem.
    if(this.level[this.scope].tokensExpected <
       this.level[this.scope].tokens.length) {
       throw new Error([
         "Unexpected token count for",
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

    if(this.scope !== this.rootScope) {
      this.level[this.scope].onToken(this.token);
    }

    // alway pass token to rootscope
    this.level[this.rootScope].onToken(this.token);

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

// ok here we should check whether the token
// was handled. or at least make sure
// that if we fire a token.
// it is in sync what we get presented back.
// This way we can detect unhandled tokens.
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
    value: data,
    start: this.scopeChar,
    end: this.current
  };

  // push token for this matcher
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

/*

I think we can make naming two sided.
Either specify the scope OR specify the name.
Where the scope, means, some token that came out of that
scope, and a direct name means that exact name.

On of the possible false positives left is then the
same naming of tokens from different scopes, but that will
likely not happen.

This is a full row, only time when it will fail is
the piping variant.

[ { name: 'PROCESS',
    scope: 'LeftHandScope',
    data: 'Read()',
    start: 31,
    end: 38 },
  { name: 'OUT_PORT',
    scope: 'LeftHandScope',
    data: 'OUT',
    start: 31,
    end: 42 },
  { name: 'ARROW',
    scope: 'RootScope',
    data: '->',
    start: 42,
    end: 45 },
  { name: 'IN_PORT',
    scope: 'RightHandScope',
    data: 'IN',
    start: 45,
    end: 48 },
  { name: 'PROCESS',
    scope: 'RightHandScope',
    data: 'Display()',
    start: 45,
    end: 58 } ]
**/

function compare(array1, array2) {
  // if the other array is a falsy value, return
  if (!array2)
      return false;

  // compare lengths - can save a lot of time
  if (array1.length != array2.length)
      return false;

  for (var i = 0, l = array1.length; i < l; i++) {
      // Check if we have nested arrays
      if (array1[i] instanceof Array && array2[i] instanceof Array) {
          // recurse into the nested arrays
          if (!array1[i].compare(array2[i]))
              return false;
      }
      else if (array1[i] != array2[i]) {
          // Warning - two different object instances will never be equal: {x:20} != {x:20}
          return false;
      }
  }
  return true;
};

Matcher.prototype.start = function(rootScope) {
  var i, scope;

  if(!rootScope) {
    throw new Error('Initial Root Scope required');
  }

  this.scope = this.rootScope = rootScope;

  // notify all, we've started
  for(scope in this.level) {
    this.level[scope].onLineStart();
  }

  for(i = 0; i < this.chars.length; i++) {
    this.next();
  }

};


Matcher.prototype.log = function(scope) {

};

Matcher.prototype.checkStructure = function(scope) {

  var s = this.level[scope];

  // output to structure
  var tokens = s.tokens.map(function(t) { return t.name; });

  // nice, left hand is never checked..
  // because it's always empty
  if(tokens.length) {

    // Check if it matches any of the structures.
    // only if a structure is defined
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
         JSON.stingify(s.structure),
         '\n\n\t',
         JSON.stringify(s.tokens)
        ].join(' '));
      }

      // do we know all tokens from a scope?
      // we should, so also add tokens to scope
      // and reset them on enter again.
      // ok, the scopes have the tokens, that's what I was at.
      // this must be run on before scope switch
      // if footprint is empty don't check, but do find out
      // why it is empty.
      this.emit('structure', {
        scope: scope,
        tokens: tokens
      });

    }

  }

};

module.exports = Matcher;
