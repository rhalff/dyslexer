var util = require('util'),
  Scope = require('../scope');

function RightHandScope(lexer) {
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

  // Used by the lexer to validate token combinations.
  this.structure = [
    ['IN_PORT', 'PROCESS'],
    ['IN_PORT', 'PROCESS', 'OUT_PORT']
  ];

  this.rules = {

    // our lexers
    '#': function(c) {
      this.lexer.toScope('CommentScope');
    }

  };

};

RightHandScope.prototype.onToken = function(token) {

  if(this.tokens.length === 0) {
    // must be the in port
    this.lexer.present('IN_PORT', token);
  } else if(this.tokens.length === 1) {
    // Must be the process
    this.lexer.present('PROCESS', token);

  } else if(this.tokens.length === 2) {
    this.lexer.present('OUT_PORT', token);
  }

};

module.exports = RightHandScope;
