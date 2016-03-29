
var _ = require('underscore')

module.exports.mergeOptions = mergeOptions

/**
 * Helper to merge options from parent class to subclasses
 */
function mergeOptions(parent, child) {
  var options = _.extend({}, parent)
  
  if (! child ) return options
  if (! parent ) return child
  
  // iterate over child options
  _.each(child, function(val, key) {
    
    options[key] = mergeField(key, val, options[key])
    
  })
  
  return options
}

/**
 * 
 */
function mergeField(key, newVal, oldVal) {
  switch (key) {
    case 'schema':
      return mergeSchema(newVal, oldVal)
      
    case 'methods':
    case 'statics':
      return undefined
    
    default: 
      return newVal
  }
}

/**
 * 
 */
function mergeSchema(newVal, oldVal) {
  var schema = _.extend({}, oldVal)
  
  _.each(newVal, function(options, field) {
    // normalize schema object format
    if ( _.isFunction(options) ) {
      schema[field] = { 'type': options }
    }
  })
  
  return schema
}