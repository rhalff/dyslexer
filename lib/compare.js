"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.compare = compare;
function compare(array1, array2) {
  var l = array1.length;
  // if the other array is a falsy value, return
  if (!array2) return false;

  // compare lengths - can save a lot of time
  if (array1.length !== array2.length) return false;

  for (var i = 0; i < l; i++) {
    // Check if we have nested arrays
    if (array1[i] instanceof Array && array2[i] instanceof Array) {
      // recurse into the nested arrays
      if (!array1[i].compare(array2[i])) return false;
    } else if (array1[i] !== array2[i]) {
      return false;
    }
  }
  return true;
}