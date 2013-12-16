var util = require('util'),
  Scope = require('../scope');

function CommentScope(matcher) {
  Scope.apply(this, arguments);
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

module.exports = CommentScope;
