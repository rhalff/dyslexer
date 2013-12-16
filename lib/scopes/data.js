var util = require('util'),
  Scope = require('../scope')

/**
 *
 * This is the data scope it is entered
 * when a quoted string is encountered.
 *
 * It will quit the scope when we reach
 * the same quote type (' or "), unless
 * that quote was escaped.
 *
 */
function DataScope(matcher) {
  Scope.apply(this, arguments);

  // dynamic token ending, configured on enter
  this.tokenEnding = [];
}

util.inherits(DataScope, Scope);

DataScope.prototype.onEnter = function() {
  this.tokenEnding = [this.matcher.scoper];
  console.log(this.constructor.name, 'onEnter');
};

DataScope.prototype.setup = function() {

  // our matchers
  this.rules = {

    '"': function(c) {

      console.log('meeting quote', c, this.matcher.scoper);
      if(!this.escape &&
        this.matcher.scoper === c) {

        this.matcher.emit('DATA');

        // switch scope
        this.matcher.back(c);
        this.count = 0; //reset
      }
      this.escape = false;

    },

    '\\': function(c) {
      console.log('scope2: should escape', c);
      this.escape = true;
    }

  };

  // aliases
  this.rules['\''] = '"';

};

DataScope.prototype.onToken = function(token) {
  console.log(this.constructor.name, 'TOKEN', token);
};

module.exports = DataScope;
