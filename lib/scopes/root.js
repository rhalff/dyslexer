var util = require('util'),
  Scope = require('../scope');

function RootScope(matcher) {

  Scope.apply(this, arguments);

}

util.inherits(RootScope, Scope);

RootScope.prototype.onLineStart = function() {
  // Note: forces left hand scope on new line
  this.matcher.toScope('LeftHandScope');
};

RootScope.prototype.setup = function() {

  // only the arrow token is expected
  this.validate = {
    ARROW: '->'
  };

};

RootScope.prototype.onToken = function(token) {

  if(token === '->') {
    this.matcher.emit('ARROW', token);
    this.matcher.toScope('RightHandScope');
  }

};

module.exports = RootScope;
