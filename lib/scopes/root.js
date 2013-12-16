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

  // ok always going to right hand scope
  // seems to be incorrect.
  // there is piping mode all the way.. didn't know that.
  // Oh no, that is still correct. right hand is just
  // repeated.
  // Could have root tokens defined.
  // anyway, root will get all tokens.
  // but will only act on it's own, and only
  // if the current scope didn't tell it to keep it's hands of
  // in that case this onToken will not fire for this rootScope.
  if(token === '->') {
    this.matcher.emit('ARROW', token);
    this.matcher.toScope('RightHandScope'); // rightHandScope
  }

};

module.exports = RootScope;
