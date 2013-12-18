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

  // Used by the matcher to validate token combinations.
  // ok COMMENT is also possible, but it's not brought back
  // from commentscope..
  this.structure = [
    ['DATA'],
    ['PROCESS', 'OUT_PORT']
  ];

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
  this.alias = {
   '\'':  '"'
  }

};

LeftHandScope.prototype.onToken = function(token) {

  // TODO: I don't think the scope switching should be the job of this scope..
  if(this.tokens.length === 1) {

    // must be the out port
    this.matcher.present('OUT_PORT', token);
    this.matcher.toScope('RootScope');

  } else if(
     this.tokensExpected === 1 &&
     this.tokens.length === 0
    ) {

    // will not work, I determine data by ''
    // it really should be determined on how many
    // tokens there were before the -> if it
    // was one, it was data..
    // Also note how this per char matching is nice.
    // but there are really only a handful of cases
    // for when this is useful at all.
    // however to detect -> is nice, but do I even use that?
    //
    // No, it's detected because root checks every token.
    // however the ' checking still is needed to start
    // data mode. unquoted data doesn't have this problem
    //
    // So maybe, although there are not many usecases
    // the per char checking is still very useful.
    //
    // I also use it for scope switching:
    //
    // For the comment scope it's very handy.
    // It's also useful for when you are starting to allow
    // stuff without whitespace, like /*This is my comment*/
    // you can then just listen for * or / and start another scope.
    // It will work a bit like the data scope and the full token
    // will be:
    // /*this is my comment*/
    //
    throw new Error('ERRR, so who is doing the data');
    this.matcher.present('DATA', token);
    this.matcher.toScope('RootScope');

  } else if(this.tokens.length === 0)  {

    if(/^EXPORT=/.test(token)) {
      this.matcher.present('EXPORT', token);
    } else {
      this.matcher.present('PROCESS', token);
    }

  }

};

module.exports = LeftHandScope;
