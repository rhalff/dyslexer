var util = require('util');

function Scope(matcher) {

  var self = this;

  this.matcher = matcher;

  // default token endings
  // a scope can overwrite this.
  this.tokenEnding = ['\n','\t',' '];

  // just for logging the getter
  this.count = 0;

  // state keepers
  this.skip = false;

  // whether we are touchy.. :-)
  this.touchy = false;

  // this could be made generic for switchers.
  // switchers are only valid until the next char.
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

  this.setup();
  this.loadRules();

}

Scope.prototype.onLineEnd = function() { };

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
      this.char[rule] = this.rules[this.rules[rule]];
    } else {
      this.char[rule] = this.rules[rule].bind(this);
    }
  }

};

module.exports = Scope;
