var util = require('util'),
  Scope = require('../scope');

function CommentScope(matcher) {
  Scope.apply(this, arguments);

  // only a new line ends this 'token'
  this.tokenEnding = ['\n'];
}

util.inherits(CommentScope, Scope);

CommentScope.prototype.setup = function() {

  this.rules = {

    // our matchers
    '#': function(c) { },

    // maybe new line should be noticed
    // to the matcher.
    '\n': function(c) {
      this.matcher.emit('COMMENT');
      this.matcher.back(c); // to root scope
    }

  };

};

CommentScope.prototype.onEnter = function() {
  console.log(this.constructor.name, 'onEnter');
};

CommentScope.prototype.onToken = function(token) {
  console.log(this.constructor.name, 'TOKEN', token);
};

module.exports = CommentScope;
