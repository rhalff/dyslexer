var fs = require('fs');

var file = './complex.fbp';
var fbpData = fs.readFileSync(file).toString('utf-8');
var Parser = require('./lib/parser');

var parser = new Parser();
var res = parser.parse(fbpData);
console.log(res);
console.log(parser.matcher.tokens);
