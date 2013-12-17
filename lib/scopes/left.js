var util = require('util'),
  Scope = require('../scope');

function LeftHandScope(matcher) {

  Scope.apply(this, arguments);

}

util.inherits(LeftHandScope, Scope);

LeftHandScope.prototype.onLineStart = function() {

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

      // Ok to whom belongs the token count ?
      // both comment and data are only 1
      // however comment is reused and datascope
      // could also, although not in fbp
      // in essence, it belongs to left hand as 1 token
      // if datascope handles two tokens,
      // that will be seen as one token for the lefthand
      // side and 2 for the datascope.
      // we do not need to 'bubble up' the token
      // but we can increase the token count on the 'parent'

    }

  };

  // aliases, will run the same function
  this.rules['\''] = '"';

};

LeftHandScope.prototype.onToken = function(token) {

  // TODO: I don't think the scope switching should be the job of this scope..
  if(this.tokenCount === 2) {

    // must be the out port
    this.matcher.present('OUT_PORT', token);
    this.matcher.toScope('RootScope');

  } else if(
     this.tokensExpected === 1 &&
     this.tokenCount === 1
    ) {
    throw new Error('ERRR, so who is doing the data');
    this.matcher.present('DATA', token);
    this.matcher.toScope('RootScope');

  } else if(this.tokenCount === 1)  {

    if(/^EXPORT=/.test(token)) {
      this.matcher.present('EXPORT', token);
    } else {
      this.matcher.present('PROCESS', token);
    }

  }

};

module.exports = LeftHandScope;
