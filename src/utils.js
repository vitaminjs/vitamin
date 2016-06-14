
var _ = require('underscore')

/**
 * Set up correctly the prototype chain for subclasses
 * 
 * @param {Function} parent
 * @param {Object} props
 * @param {Object} statics
 * @return constructor function
 */
module.exports.extend = function (parent, props, statics) {
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