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
    '#': function(c) { }

  };

};

CommentScope.prototype.onEnter = function() {
  console.log(this.constructor.name, 'onEnter');
};

CommentScope.prototype.onToken = function(token) {

  console.log(this.constructor.name, 'GOT TOKEN', token);

  // so if we have to split a name, we could do multiple
  // emits... :-)
  this.matcher.emit('COMMENT', token);

  this.matcher.back(); // to root scope

};

module.exports = CommentScope;
