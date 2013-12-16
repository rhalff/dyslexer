var util = require('util'),
  Scope = require('../scope');

function RightHandScope(matcher) {
  Scope.apply(this, arguments);
}

util.inherits(RightHandScope, Scope);

RightHandScope.prototype.setup = function() {

  this.field = 0;

  this.rules = {

    // our matchers
    '#': function(c) {
      this.matcher.toScope('CommentScope');
    },

    // maybe space should be general.
    // ->  SOMETHING
    // means leading whitespace for SOMETHING
    // we want to make sure righthand scope starts at
    // SOMETHING without leading whitespace.
    // Maybe this could be generic within Scope.
    // Also maybe there could be a scope_enter
    // and scope_end 'event'
    // The whole Fielding part should be handled
    // by the matcher. each scope can has it's field set.
    // and maybe also access the total amount of fields.
    //
    // 1 + 1 = 2;
    // 1   +   1  =   2;
    //
    // scopes?
    //
    //  left right
    //
    //  left:  left_value operator right_value
    //  right: value
    //
    //  ; = seperator just like new line.
    //
    //  assert could be used to check types.
    //
    //  anyway it indicates that field counting is the
    //  job of the matcher.
    //  {
    //    RightHandScope: {
    //      fieldCount: 1
    //    }
    //  }
    //
    //  that data trick where it can only be 1 for now just
    //  belongs to data.
    //
    ' ': function(c) {
      if(this.matcher.chars[this.current - 1] !== ' ') {
        this.field++;
      }

    },
    '(': function(c) { },
    ')': function(c) { },
    '\n': function(c) {
      this.matcher.toScope('RootScope', c); // to root scope
    }

  };

  // aliases, will run the same function
  this.rules['\''] = '"';
  this.rules[',']  = '\n';

};

module.exports = RightHandScope;
