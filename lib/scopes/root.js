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

  // 2 fields or 1
  this.field = 0;
  this.space = false;

  Scope.apply(this, arguments);


}

util.inherits(RootScope, Scope);

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
    '#': function(c) {
      this.matcher.toScope('CommentScope', c);
    },
    // meeting quotes on the top level, means visiting scope 1
    '"': function(c) {
      this.field++;
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
      if(this.matcher.chars[this.current - 1] !== ' ') {
        this.field++;
      }

    },
    '>': function(c) {
      if(this.matcher.chars[this.matcher.current - 1] === '-') {
        this.matcher.emit('ARROW');
        this.matcher.toScope('RightHandScope', c); // rightHandScope
        this.field = 0; // reset field
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

module.exports = RootScope;
