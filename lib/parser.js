var Matcher = require('./matcher');

var LeftHandScope = require('./scopes/left'),
  RightHandScope = require('./scopes/right'),
  DataScope = require('./scopes/data'),
  CommentScope = require('./scopes/comment'),
  RootScope = require('./scopes/root');

function Parser() {

}

Parser.prototype.parse = function(str) {

  var part, parts = [];

  var chars = str.split('');

  var matcher = new Matcher(chars);
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

  matcher.addScope(LeftHandScope);
  matcher.addScope(CommentScope);
  matcher.addScope(RootScope);
  matcher.addScope(DataScope);
  matcher.addScope(RightHandScope);
/*
  matcher.on('token', function(data) {

    // ok this also sends the empty ones.
    // lines without tokens.
    console.log( data.name);

  });
*/

  // Tokens will popup in order of appearance and per line
  matcher.on('lineTokens', function(tokens, line) {

    tokens.forEach(function(token) {

      switch(token) {

        case 'DATA':
          break;

        case 'ARROW':
          break;

        case 'IN_PORT':
          break;

        case 'OUT_PORT':
          break;

        case 'PROCESS':
          break;

        case 'EXPORT':
          break;


      };

    });

  });

/*
  matcher.on('scopeSwitch', function(data) {

     console.log(
       'Switching from:',
       data.from,
       'to',
       data.to
     );

  });

  matcher.on('structure', function(data) {

     console.log(
       'Structure:',
       data.scope,
       data.tokens
     );

  });
*/

  matcher.start('RootScope');


};

module.exports = Parser;
