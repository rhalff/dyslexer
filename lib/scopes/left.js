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

  // Left hand can have 1 or two fields
  this.field = 0;
  this.space = false;

  this.expectedFields = 2;

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
      // this.field++; -- space determines fields..
      this.expectedFields = 1;
      this.matcher.toScope('DataScope', c);

    },
    ' ': function(c) {
      // at the first level space creates the next token.
      // but what to do with func   () which is func()
      // it's better to ignore whitespace at the first level.
      // but then -> IN Read() becomes ->INRead()
      // first make only one whitespace noticed.
      // func () should look back. we can only determine it
      // after the second whitespace IN Read () second whitespace
      // indicates, IN was on it's own and Read belonged to ()
      // the quotes are very determined, we know it's data after the
      // last quote. -> is easy also
      //
      // hm i can go to the root scope here
      // either if data is set or if the field is 2
      // however how to detect errors from the root scope.
      //
      // 'data'  PORT -> is invalid.
      // 'data' -> is valid.
      //  Read() PORT -> is valid.
      // 'Read(mycomponent) PORT -> is valid.
      //
      // So process should trigger the amount of expected fields
      // Just as data sets the expected fields to 1
      // This is something LeftHand should decide,
      // which is _this_ file
      //
      // maybe the cool thing is, the matcher 'emits' the token
      // after it is read, however, the current scope was
      // also reading it along the way.
      //
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
      if(this.matcher.chars[this.current - 1] !== ' ') {
        this.field++;
        if(this.field === this.expectedFields) {
          // return to root, let root handle ->
          this.matcher.toScope('RootScope', c);
        }
      }

    },
    '(': function(c) { },
    ')': function(c) { },
    ',': function(c) { },
    '\n': function(c) {
      console.log('new line! by:', c);
    }

  };

  // aliases, will run the same function
  this.rules['\''] = '"';
  this.rules[',']  = '\n';

  function token_end() {

/**
 * Err won't work if we visit per token?
 * will work, because given tokens do not determine the
 * scope switching.
 *
 * So this should be on scope_leave.
 * err, but only if we go to the root level.. :p
 * pff. Soo, on_return
 *
 *  if(this.field === this.expectedFields) {
 *    this.matcher.toScope('RootScope');
 *  } else {
 *    throw new Error("Unexpected field length");
 *  }
 */

  }

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
  console.log(this.constructor.name, 'GOT TOKEN', token);
  this.matcher.emit('COOL_HAVE_TO_DETERMINE WHAT IT IS...', token);
};

module.exports = LeftHandScope;
