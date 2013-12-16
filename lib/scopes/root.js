var util = require('util'),
  Scope = require('../scope');

/**
 *
 * This is the Root Scope.
 *
 * It is the first scope.
 *
 * Emits:
 *
 *   - NEW_LINE
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
 * Should we take care of numbering?
 * Or just start at the root scope.
 *
 * It's always up down in a parser.
 * No fancy jumping around, so leaving
 * always means going back to the parent.
 *
 * This way we can even print a nice parse tree.
 *
 * Data belongs to lefthand side and left hand side
 * belongs to root.
 *
 * I hope after that I can generalize it, so everything
 * is not super specific to this .fbp format.
 *
 * The root scope is then always default, al it does is
 * line breaking. and starting other scopes.
 *
 */
function RootScope(matcher) {

  Scope.apply(this, arguments);

}

util.inherits(RootScope, Scope);

RootScope.prototype.onEnter = function() {
  console.log(this.constructor.name, 'onEnter');
};

RootScope.prototype.setup = function() {

  // OK, we should know begining of line
  this.rules = {

    // OK, how to detect beginning of line.
    // we can do that from \n and init the parser
    // with a phantom \n so it mimics ^ from regexp.
    // Left scope has to start on new line.
    // But then left scope has to detect comments...
    // Which is ok, they should just all jump to comment scope.
    // There is also no distinction between ^ or $

    // our matchers
    // this is also the lefthand's job.
    // I think root should delegate to leftHand onEnter.
    // uh, not really, when we come back we would switch
    // to left immediatly not what we want.
    // It could be done, on start, but that doesn't make any sense
    // Or onstart is fired, by the matcher and is not allowed
    // by other scopes.. ok...
    // Or maybe add a lineStart 'event' and just notice all scopes
    // this is happening, same with lineEnd.
    // Most will not 'listen' for this but sometimes handy as
    // for this root scope.
    '#': function(c) {
      this.matcher.toScope('CommentScope', c);
    },
    // meeting quotes on the top level, means visiting scope 1
    '"': function(c) {
      this.matcher.toScope('DataScope', c);
    },
    '>': function(c) {
      if(this.matcher.chars[this.matcher.current - 1] === '-') {
        this.matcher.emit('ARROW');
        this.matcher.toScope('RightHandScope', c); // rightHandScope
      }
    },
    ',': function(c) { },
    '\n': function(c) {

      if(c !== '!') {
        this.matcher.emit('NEW_LINE');
      }
      this.matcher.toScope('LeftHandScope');
    }

  };

  // aliases, will run the same function
  this.rules['\''] = '"';
  this.rules[',']  = '\n';

};

RootScope.prototype.onToken = function(token) {

  // hm, why don't I get -> emitted as token?
  // Right Handscope receives it..
  console.log(this.constructor.name, 'GOT TOKEN', token);
  this.matcher.emit('ROOT WILL NEVER HAPPEN?', token);
};

module.exports = RootScope;
