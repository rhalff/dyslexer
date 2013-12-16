var util = require('util'),
  Scope = require('../scope');

function RightHandScope(matcher) {
  Scope.apply(this, arguments);

  this.tokenCount = 0;
}

util.inherits(RightHandScope, Scope);

RightHandScope.prototype.setup = function() {

  this.rules = {

    // our matchers
    '#': function(c) {
      this.matcher.toScope('CommentScope');
    }

  };

};

RightHandScope.prototype.onEnter = function() {
  console.log(this.constructor.name, 'onEnter');
};

RightHandScope.prototype.onToken = function(token) {

  this.tokenCount++;

  // er ok, nice, if we only expect one token, how to determine the second.
  // we could just ignore and let the parser mess it up silently.
  // but we don't want that.
  // If after data we delegate it back to root and there is extra data.
  // what will it do? it will only go to right hand after it finds ->
  // what happens to the extra data, it will stay in root.
  // So, root should be the one who maybe could emit UNKNOWN data.
  // yep..
  if(this.tokenCount === 1) {
    // must be the in port
    this.matcher.emit('IN_PORT', token);
  } else if(this.tokenCount === 2) {

    // Must be the process
    this.matcher.emit('PROCESS', token);
    this.matcher.toScope('RootScope');

  } else {
    // Must be ... errrr
    console.log('ERRORRRRRRRRRR, RESET, RESET');
  }

};

module.exports = RightHandScope;
