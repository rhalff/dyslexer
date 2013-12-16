var Matcher = require('./matcher');

function Parser() {

}

Parser.prototype.parse = function(str) {

  var part, parts = [];

  var chars = str.split('');

  this.matcher = new Matcher(chars);

  for(i = 0; i < chars.length; i++) {
    part = this.matcher.next();
    if(part) {
      parts.push(part);
    }
  }

  console.log(parts);

};

module.exports = Parser;
