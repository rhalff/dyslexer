var fs = require('fs');
var fbpData = fs.readFileSync('./parseme.fbp').toString('utf-8');
var Parser = require('./lib/parser');

var parser = new Parser();
var res = parser.parse(fbpData);
console.log(res);
console.log(parser.matcher.tokens);
