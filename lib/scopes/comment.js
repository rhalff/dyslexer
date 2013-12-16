var util = require('util'),
  Scope = require('../scope');

function CommentScope(matcher) {
  Scope.apply(this, arguments);

  // only a new line ends this 'token'
  this.tokenEnding = ['\n'];

}

util.inherits(CommentScope, Scope);

CommentScope.prototype.onLineStart = function() {

  // setting this is important
  // mandatory actually.
  this.tokensExpected = 1;

};

CommentScope.prototype.setup = function() {

  // Used to validate the tokens.
  this.validate = {
    COMMENT: /.*/
  };

  this.rules = {

    // our matchers
    '#': function(c) { }

  };

};

CommentScope.prototype.onToken = function(token) {

  console.log(this.constructor.name, 'GOT TOKEN', token);

  // so if we have to split a name, we could do multiple
  // emits... :-)
  this.matcher.emit('COMMENT', token);

};

module.exports = CommentScope;
