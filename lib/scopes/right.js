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

  this.rules = {

    // our matchers
    '#': function(c) {
      this.matcher.toScope('CommentScope');
    }

  };

};

RightHandScope.prototype.onToken = function(token) {

  if(this.tokenCount === 1) {
    // must be the in port
    this.matcher.emit('IN_PORT', token);
  } else if(this.tokenCount === 2) {
    // Must be the process
    this.matcher.emit('PROCESS', token);

  } else if(this.tokenCount === 3) {
    this.matcher.emit('OUT_PORT', token);
  }

};

module.exports = RightHandScope;
