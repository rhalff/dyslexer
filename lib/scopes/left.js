var util = require('util'),
  Scope = require('../scope');

/**
 *
 * This is the LeftHand Scope.
 *
 * It is the first scope.
 *
 * Emits:
 *
 *   - DATA
 *   - PROCESS
 *   - OUT_PORT
 *
 * Err, ok but it also scans the comma.
 *
 * Comma belongs in the root scope and
 * we should then enter lefthandscope.
 * New Line also belongs in the root scope.
 *
 * If we only run root scope, all it will do
 * is emit new lines, (either comma or \n);
 *
 * Ok, root scope should trigger lefthandscope
 * on beginning of line.
 *
 * I really hope when it works I can refactor
 * this into something useful.
 *
 */
function LeftHandScope(matcher) {

  // how many fields this scope expects
  // can be changed dynamically
  // this could become generic I think
  this.tokensExpected = 2;

  this.tokenCount = 0;

  Scope.apply(this, arguments);

}

util.inherits(LeftHandScope, Scope);

LeftHandScope.prototype.setup = function() {

  this.rules = {

    // our matchers
    // ok, matcher should already just push
    // the tokens.
    // then the key can be a regexp again.
    // neh, this is a bit more powerful.
    // maybe optional? act on token
    // or act per character?
    //
    // e.g. what to do with ns:name
    // it's a full token.
    // it the scope can just read by char
    // and wait for : it would be better.
    // neh we can match and put the match
    // result in the callback
    // /(\w):(\w)/ e.g.
    // so per char becomes useless then.
    // but the cool thing is it looks what I've
    // already made, but now the same without
    // using the impossible split() method.
    // we will still jump to scopes.
    // but what we match are tokens.
    //
    // 1 + 1 = 2
    // Tokens:
    //
    //  1,+,1,=,2
    //
    //  Root, /\d+/ > leftHand
    //  LeftHand:
    //    process 1
    //    process +
    //    process 1
    //  back()
    //
    //  Root: /=/ > rightHand
    //    process 2
    //  back()

    // Skip everything until new line
    '#': function(c) {
      this.matcher.toScope('CommentScope');
    },

    // meeting quotes on the top level, means visiting scope Data
    '"': function(c) {

      // We only expect one token now.
      this.tokensExpected = 1;
      this.matcher.toScope('DataScope', c);

    },
    '(': function(c) { },
    ')': function(c) { },
    ',': function(c) { }

  };

  // aliases, will run the same function
  this.rules['\''] = '"';

};

LeftHandScope.prototype.onEnter = function() {
  console.log(this.constructor.name, 'onEnter');
};


/**
 *
 * Note, somewhere during reading we already got the scope assigned.
 * This is when a token is fully read. So we by now should
 * already know what we have received.
 *
 */
LeftHandScope.prototype.onToken = function(token) {

  this.tokenCount++;

  // So, root should be the one who maybe could emit UNKNOWN data.
  if(this.tokenCount === 2) {
    // must be the out port
    this.matcher.emit('OUT_PORT', token);
    this.matcher.toScope('RootScope');
  } else if(this.tokensExpected === 1) {

    // Must be data
    this.matcher.emit('DATA', token);
    this.matcher.toScope('RootScope');

  } else {
    // Must be the process
    this.matcher.emit('PROCESS', token);
  }

};

module.exports = LeftHandScope;

// e.g. we get Read() as a token, but we read along, so
// we already know it contains ()
//
// The matcher however, has no clue what the token means.
// it just knows it has a token.
//
// Hmz and along the way, the current scope has already determined
// that what we are reading doesn't belong to us, so it has switched
// the scope for the matcher, sorry.. not for me. and the
// matcher just passes it on to whatever the current scope is.
//
// So then if you want to do validation, you just do it when the
// full token is received.
//
// This is also the place where you can throw the errors.
//
// But let me see.
// LeftHandScope, starts reading Read(), it sees ( and determines it is
// a process (not  how it works now, but as example)
// It then switches to processScope, the processScope reads the last )
// probably ignores it, the processScope gets the token.
// validates it and returns.
//
// Scopes that are switched to, must be able to rely the former
// scope made the right decission.
//
// So while you read, scopes are switched, that's the idea.
