var util = require('util'),
  Scope = require('../scope');

function RootScope(matcher) {

  Scope.apply(this, arguments);

}

util.inherits(RootScope, Scope);

RootScope.prototype.onLineStart = function() {
  // Note: forces left hand scope on new line
  this.tokensExpected = 3
  this.matcher.toScope('LeftHandScope');
};

RootScope.prototype.setup = function() {

  // not sure how, but also checking
  // structure on the root level would be great.
  // it would be grouped by scopes.
  // note however that I mix scopes and tokens.
  // anyway that could be done.
  // root cannot be checked yet, dunno what to do with the
  // arrow,arrow -> -> -> pipes. they are of unknown length.
  // could do some kind of wildcard *ARROW
  /*
  this.structure = [
    ['ARROW'], // TODO: this is what it is now, which is actually wrong.
    ['LeftHandScope','ARROW','RightHandScope'],
    ['LeftHandScope','ARROW','RightHandScope'],
    ['LeftHandScope'] // Lefthandscope itself check if it is comment..
  ];
  */

  // only the arrow token is expected
  this.validate = {
    ARROW: '->'
  };

};

RootScope.prototype.onToken = function(token) {

  if(token === '->') {
    this.matcher.present('ARROW', token);
    this.matcher.toScope('RightHandScope');
  }

};

module.exports = RootScope;
