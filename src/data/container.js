
var _ = require('underscore')

module.exports = Container

/**
 * 
 */
function Container(owner, data) {
  this._data = {}
  this._original = {}
  
  this.set(data)
}

/**
 * Set model attributes
 */
Container.prototype.set = function set(attr, val) {
  if ( _.isEmpty(attr) ) return this
  
  var attributes = {}
  if ( _.isObject(attr) ) { attributes = attr }
  else { attributes[attr] = val }
  
  // set current state
  for ( attr in attributes ) {
    val = attributes[attr]
    
    // set the attribute's new value
    this._set(attr, val)
  }
  
  return this
}

/**
 * Get the value of an attribute.
 * 
 * @param {String} attr name
 */
Container.prototype.get = function get(attr) {
  return this._data[attr]
}

/**
 * 
 * 
 * @param {String} attr name
 */
Container.prototype.has = function has(attr) {
  return !_.isUndefined(this.get(attr))
}

/**
 * 
 */
Container.prototype.toJSON = function toJSON() {
  return _.clone(this._data)
}

/**
 * 
 * 
 * @param {String} attr name
 */
Container.prototype.isDirty = function isDirty(attr) {
  return 
    (attr == null) ?
    !_.isEmpty(this._original) : 
    _.has(this._original, attr)
}

/**
 * Attribute value setter 
 * used internally
 * 
 * @param {String} key attribute name
 * @param {Mixed} newVal value
 * @return {boolean} false if no changes made or invalid value
 * 
 * @private
 */
Container.prototype._set = function _set(key, newVal) {
  var oldVal = this._data[key]
  
  // if no changes, return false
  if ( oldVal === newVal ) return false
  
  // set the new value
  this._data[key] = newVal
  
  // set original value
  if (! _.isUndefined(oldVal) ) this._original[key] = oldVal
}