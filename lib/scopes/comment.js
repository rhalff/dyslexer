var util = require('util'),
  Scope = require('../scope');

function CommentScope(lexer) {
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

    // our lexers
    '#': function(c) { }

  };

};

CommentScope.prototype.onToken = function(token) {

  this.lexer.present('COMMENT', token);

};

module.exports = CommentScope;
