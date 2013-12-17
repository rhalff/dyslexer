var fs = require('fs');

var file = './complex.fbp';
//var file = './parseme.fbp';
var fbpData = fs.readFileSync(file).toString('utf-8');
var Parser = require('./lib/parser');

var parser = new Parser();
var res = parser.parse(fbpData);
