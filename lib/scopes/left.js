var util = require('util'),
  Scope = require('../scope');

function LeftHandScope(matcher) {

  Scope.apply(this, arguments);

}

util.inherits(LeftHandScope, Scope);

LeftHandScope.prototype.onLineStart = function() {
  console.log('Set tokens expected!');

  this.tokensExpected = 2;
};

LeftHandScope.prototype.setup = function() {

  // Used to validate the tokens.
  this.validate = {
    OUT_PORT: /^[A-z_]+$/,
    EXPORT: /^EXPORT=[A-z]+/,
    PROCESS: /^[A-z_]+(\([\w\/]*\))?$/
    // DATA: /.*/
  };

  this.rules = {

    '#': function(c) {
      this.matcher.toScope('CommentScope');
    },

    // quotes means data, if so we only expect one token
    '"': function(c) {

      // We only expect one token now.
      this.tokensExpected = 1;
      this.matcher.toScope('DataScope', c);

    }

  };

  // aliases, will run the same function
  this.rules['\''] = '"';

};

LeftHandScope.prototype.onToken = function(token) {

  // TODO: I don't think the scope switching should be the job of this scope..
  if(this.tokenCount === 2) {

    // must be the out port
    this.matcher.emit('OUT_PORT', token);
    this.matcher.toScope('RootScope');

  } else if(
     this.tokensExpected === 1 &&
     this.tokenCount === 1
    ) {

    this.matcher.emit('DATA', token);
    this.matcher.toScope('RootScope');

  } else if(this.tokenCount === 1)  {

    if(/^EXPORT=/.test(token)) {
      this.matcher.emit('EXPORT', token);
    } else {
      this.matcher.emit('PROCESS', token);
    }

  }

};

module.exports = LeftHandScope;
