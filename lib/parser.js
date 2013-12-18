var Matcher = require('./matcher');

var LeftHandScope = require('./scopes/left'),
  RightHandScope = require('./scopes/right'),
  DataScope = require('./scopes/data'),
  CommentScope = require('./scopes/comment'),
  RootScope = require('./scopes/root'),
  FBPBuilder = require('./FBPBuilder');

var fbpBuilder = new FBPBuilder();

function Parser() { }

Parser.prototype.parse = function(str) {

  var part, parts = [];

  var chars = str.split('');

  var matcher = new Matcher(chars);
  matcher.addScope(LeftHandScope);
  matcher.addScope(CommentScope);
  matcher.addScope(RootScope);
  matcher.addScope(DataScope);
  matcher.addScope(RightHandScope);

  // Tokens will popup in order of appearance and per line
  matcher.on('lineTokens', fbpBuilder.handleToken.bind(fbpBuilder));
  matcher.start('RootScope');


};

module.exports = Parser;

/*
  var leftHandScope = new Scope(matcher);
  leftHandScope.setup({


  });
  leftHandScope.on('lineStart', function() {
    this.tokensExpected = 2;
  });
  leftHandScope.on('lineStart', function() {
    this.tokensExpected = 2;
  });

  var rightHandScope = new Scope(matcher);
  var rootScope = new Scope(matcher);
  var dataScope = new Scope(matcher);
  var commentScope = new Scope(matcher);
*/

