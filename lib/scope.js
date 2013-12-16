var util = require('util');

function Scope(matcher) {

  this.matcher = matcher;

  // default token endings
  // a scope can overwrite this.
  this.tokenEnding = ['\n','\t',' '];

  // just for logging the getter
  this.count = 0;

  // If this is set, the parser will throw an error
  // if there are more tokens, within the current scope.
  this.tokensExpected = undefined;

  // the amount of tokens processed by
  // this scope, on the current line
  // automatically reset on each line start
  this.tokenCount = 0;

  // whether we are touchy
  // remove this, not used anymore
  this.touchy = false;

  // check for escaped token endings
  this.escape = false;

  // this could be made generic for switchers.
  // switchers are only valid until the next char.
  this.char = {};
 /*
  Object.defineProperty(this, 'char', {
    get: function() {

      if(self.touchy) {

        // take a breath
        self.count++;

        // err ok, still impossible to keep state
        // this way.
        if(self.escape === true) {
          // still true but indicated removal on
          // next run.
          self.escape = 1;
        } else {
          self.escape = undefined;
        }
      }

      return this;
    }
  });
  */

  this.setup();
  this.loadRules();

}

Scope.prototype.onLineEnd   = function() { };
Scope.prototype.onLineStart = function() { };
Scope.prototype.onEnter     = function() { };

Scope.prototype.loadRules = function() {

  var rule;

  this.touch = false;

  for(rule in this.rules) {
    // add rule and bind ourselfs
    if(typeof this.rules[rule] === 'string') {
      // create an alias, the function is reused.
      // so the char comming in can now be of multiple types.
      // e.g. both ' or ", or
      //      both - and > to detect ->
      console.log('Alias:', rule, this.rules[rule]);
      this.char[rule] = this.rules[this.rules[rule]].bind(this);
    } else {
      this.char[rule] = this.rules[rule].bind(this);
    }
  }

};

module.exports = Scope;
