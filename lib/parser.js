var Matcher = require('./matcher');
 fs = require('fs');

var LeftHandScope = require('./scopes/left'),
  RightHandScope = require('./scopes/right'),
  DataScope = require('./scopes/data'),
  CommentScope = require('./scopes/comment'),
  RootScope = require('./scopes/root'),
  Renderer = require('./render/noflo'),
  FBPBuilder = require('./FBPBuilder');

var fbpBuilder    = new FBPBuilder();
var noFloRenderer = new Renderer();
fbpBuilder.addRenderer(noFloRenderer);

function Parser() { }

Parser.prototype.parse = function(str) {

  var part, parts = [];

  var matcher = new Matcher('RootScope');
  matcher.addScope(LeftHandScope);
  matcher.addScope(CommentScope);
  matcher.addScope(RootScope);
  matcher.addScope(DataScope);
  matcher.addScope(RightHandScope);

  // Tokens will popup in order of appearance and per line
  matcher.on('lineTokens', fbpBuilder.handleToken.bind(fbpBuilder));
//  matcher.readChunk(str);
//  matcher.readChunk(str);

  var rs = fs.createReadStream('./huge.fbp');
  var buf = '';
  rs.on('data', function(chunk) {
    rs.pause();
    chunk = buf + chunk;
    var lines = chunk.toString().split("\n");
    buf = lines.pop();
    matcher.readChunk(chunk);
    rs.resume();
  });
  rs.on('end', function() {

    console.log('done');
    //console.log(noFloRenderer.toJSON());

  });

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

