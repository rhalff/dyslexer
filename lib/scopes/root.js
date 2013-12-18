var util = require('util'),
  Scope = require('../scope');

function RootScope(lexer) {

  Scope.apply(this, arguments);

}

util.inherits(RootScope, Scope);

RootScope.prototype.onLineStart = function() {
  // Note: forces left hand scope on new line
  this.tokensExpected = 10;
  this.lexer.toScope('LeftHandScope');
};

RootScope.prototype.setup = function() {

  // only the arrow token is expected
  this.validate = {
    ARROW: '->'
  };

};

RootScope.prototype.onToken = function(token) {

  if(token === '->') {
    this.lexer.present('ARROW', token);
    this.lexer.toScope('RightHandScope');
  }

};

module.exports = RootScope;
