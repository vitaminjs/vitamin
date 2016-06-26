
var _ = require('underscore')

/**
 * Set up correctly the prototype chain for subclasses
 * 
 * @param {Function} parent
 * @param {Object} props
 * @param {Object} statics
 * @return constructor function
 */
module.exports.extend = function extend(parent, props, statics) {
  // default constructor simply calls the `parent`
  var child = function () { parent.apply(this, arguments) }
  
  // use a custom constructor
  if ( _.has(props, 'constructor') ) child = props.constructor
  
  // set the prototype chain to inherit from `parent`
  child.prototype = Object.create(parent.prototype, {
    constructor: { value: child } 
  })
  
  // add static and instance properties
  _.extend(child, parent, statics)
  _.extend(child.prototype, props)
  
  return child
}

/**
 * Convert a string to camel case
 * 
 * @param {String} str
 * @return string
 */
module.exports.camelize = function camelize(str) {
  return String(str).trim().replace(/[-_\s]+(.)?/g, function (match, c) {
    return c ? c.toUpperCase() : '' 
  })
}

/**
 * Capitalize the first letter of a string
 * 
 * @param {String} str
 * @return string
 */
module.exports.capitalize = function capitalize(str) {
  str = String(str)
  
  return str.charAt(0).toUpperCase() + str.slice(1)
}