// Polyfill for Object.hasOwn (ES2022) - needed by bundled deep-equality libs
// (e.g. lodash.isEqual) on browsers/runtimes that don't support it natively.
//
// This file is imported as a SIDE-EFFECT import in index.js so that it executes
// BEFORE any other module (React, App, routing, etc.) is evaluated. Because ES
// module imports are hoisted, keeping this inline in index.js would cause it to
// run AFTER the imports it is meant to protect.
if (!Object.hasOwn) {
  Object.hasOwn = function hasOwn(obj, prop) {
    if (obj == null) {
      throw new TypeError('Cannot convert undefined or null to object');
    }
    return Object.prototype.hasOwnProperty.call(Object(obj), prop);
  };
}
