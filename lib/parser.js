var Matcher = require('./matcher');

function Parser() {

}

Parser.prototype.parse = function(str) {

  var part, parts = [];

  var chars = str.split('');

  this.matcher = new Matcher(chars);
/*
  this.matcher.on('lineTokens', function(err) {

    // ok this also sends the empty ones.
    // lines without tokens.
    console.log(err);

  });
*/

  // err ok this makes no sense..
  // basically we do not need parser.
  for(i = 0; i < chars.length; i++) {
    this.matcher.next();
  }

};

module.exports = Parser;
