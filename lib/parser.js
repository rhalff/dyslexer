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
  matcher.addScope(LeftHandScope);
  matcher.addScope(CommentScope);
  matcher.addScope(RootScope);
  matcher.addScope(DataScope);
  matcher.addScope(RightHandScope);

  matcher.on('eol', function(line) {

    // ok this also sends the empty ones.
    // lines without tokens.
    console.log(line);

  });

  matcher.on('lineTokens', function(tokens) {

    // ok this also sends the empty ones.
    // lines without tokens.
    console.log(JSON.stringify(tokens));

  });

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

  matcher.start('RootScope');


};

module.exports = Parser;
