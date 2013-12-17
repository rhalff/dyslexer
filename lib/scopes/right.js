var util = require('util'),
  Scope = require('../scope');

function RightHandScope(matcher) {
  Scope.apply(this, arguments);
}

util.inherits(RightHandScope, Scope);

RightHandScope.prototype.onLineStart = function() {
  this.tokensExpected = 3;
};

RightHandScope.prototype.setup = function() {

  // Used to validate the tokens.
  this.validate = {
    IN_PORT: /[A-z_]+/,
    PROCESS: /[A-z_\(\)]+/
  };

  // Used by the matcher to validate token combinations.
  this.structure = [
    ['IN_PORT', 'PROCESS'],
    ['IN_PORT', 'PROCESS', 'OUT_PORT']
  ];

  this.rules = {

    // our matchers
    '#': function(c) {
      this.matcher.toScope('CommentScope');
    }

  };

};

RightHandScope.prototype.onToken = function(token) {

  if(this.tokens.length === 0) {
    // must be the in port
    this.matcher.present('IN_PORT', token);
  } else if(this.tokens.length === 1) {
    // Must be the process
    this.matcher.present('PROCESS', token);

  } else if(this.tokens.length === 2) {
    this.matcher.present('OUT_PORT', token);
  }

};

module.exports = RightHandScope;
