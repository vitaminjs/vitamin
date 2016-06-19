
var _ = require('underscore')

/**
 * Create and return a custom error class
 * 
 * @param {String} name
 * @param {Function} parent constructor
 * @return {Function}
 */
function createError(name, props) {
  // constructor
  var Ctor = _.has(props, 'constructor') 
    ? props.constructor 
    : function Ctor(message) {
    this.name = name
    this.message = message || this.message
    
    Error.captureStackTrace(this, Ctor)
  }
  
  // prototype inheritance
  Ctor.prototype = Object.create(Error.prototype)
  _.assign(Ctor.prototype, { constructor: Ctor }, props)
  
  return Ctor
}

module.exports.createError = createError

/**
 * Model Not Found Custom Error
 */
module.exports.ModelNotFoundError = createError('ModelNotFoundError', {
  message: "Model Not Found",
  code: 404
})