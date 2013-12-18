var util = require('util'),
  Scope = require('../scope');

function LeftHandScope(lexer) {

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

  // Used by the lexer to validate token combinations.
  // ok COMMENT is also possible, but it's not brought back
  // from commentscope..
  this.structure = [
    ['DATA'],
    ['EXPORT'],
    ['PROCESS', 'OUT_PORT']
  ];

  this.rules = {

    '#': function(c) {
      this.lexer.toScope('CommentScope');
    },

    // quotes means data, if so we only expect one token
    '"': function(c) {

      // We only expect one token now.
      this.tokensExpected = 1;
      this.lexer.toScope('DataScope', c);

    }

  };

  // aliases, will run the same function
  this.alias = {
   '\'':  '"'
  }

};

LeftHandScope.prototype.onToken = function(token) {

  // TODO: I don't think the scope switching should be the job of this scope..
  if(this.tokens.length === 1) {

    // must be the out port
    this.lexer.present('OUT_PORT', token);
    this.lexer.toScope('RootScope');

  } else if(
     this.tokensExpected === 1 &&
     this.tokens.length === 0
    ) {

    throw new Error('ERRR, so who is doing the data');
    this.lexer.present('DATA', token);
    this.lexer.toScope('RootScope');

  } else if(this.tokens.length === 0)  {

    if(/^EXPORT=/.test(token)) {
      this.lexer.present('EXPORT', token);
    } else {
      this.lexer.present('PROCESS', token);
    }

  }

};

module.exports = LeftHandScope;
