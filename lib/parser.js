var DysLexer = require('./dyslexer');
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

  var dl = new DysLexer('RootScope');
  dl.addScope(LeftHandScope);
  dl.addScope(CommentScope);
  dl.addScope(RootScope);
  dl.addScope(DataScope);
  dl.addScope(RightHandScope);

  // Tokens will popup in order of appearance and per line
  dl.on('lineTokens', fbpBuilder.handleToken.bind(fbpBuilder));
//  dl.readChunk(str);
//  dl.readChunk(str);

  var rs = fs.createReadStream('./huge.fbp');
  var buf = '';
  rs.on('data', function(chunk) {
    rs.pause();
    chunk = buf + chunk;
    var lines = chunk.toString().split("\n");
    buf = lines.pop();
    dl.readChunk(chunk);
    rs.resume();
  });
  rs.on('end', function() {

    console.log('done');
    //console.log(noFloRenderer.toJSON());

  });

};

module.exports = Parser;

/*
  var leftHandScope = new Scope(dl);
  leftHandScope.setup({


  });
  leftHandScope.on('lineStart', function() {
    this.tokensExpected = 2;
  });
  leftHandScope.on('lineStart', function() {
    this.tokensExpected = 2;
  });

  var rightHandScope = new Scope(dl);
  var rootScope = new Scope(dl);
  var dataScope = new Scope(dl);
  var commentScope = new Scope(dl);
*/

