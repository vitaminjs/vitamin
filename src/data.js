
var _ = require('underscore')

module.exports = Data

/**
 * 
 */
function Data(owner, attributes) {
  this._data = {}
  this._original = {}
  this._schema = owner.getOption('schema')
  
  this.fill(attributes)
}

/**
 * 
 */
Data.prototype.fill = function fill(attributes) {
  var attr, val
  
  if ( _.isEmpty(attributes) ) return this
  
  for ( attr in attributes ) {
    val = attributes[attr]
    
    // set the attribute's new value
    this.set(attr, val)
  }
  
  return this
}

/**
 * Set model's attribute value
 * 
 * @param {String} attr field name
 * @param {Mixed} val the value
 */
Data.prototype.set = function set(attr, val) {
  var oldVal = this._data[attr]
  
  if ( _.isEmpty(attr) ) return this
  
  // if no changes, return
  if ( oldVal === val ) return this
  
  // set the new value
  this._data[attr] = val
  
  // set original value
  if (! _.isUndefined(oldVal) ) this._original[attr] = oldVal
  
  return this
}

/**
 * Get the value of an attribute.
 * 
 * @param {String} attr name
 */
Data.prototype.get = function get(attr) {
  return this._data[attr]
}

/**
 * 
 * 
 * @param {String} attr name
 */
Data.prototype.has = function has(attr) {
  return !_.isUndefined(this.get(attr))
}

/**
 * 
 */
Data.prototype.toJSON = function toJSON() {
  return this.serialize()
}

/**
 * 
 */
Data.prototype.serialize = function serialize() {
  return _.clone(this._data)
}

/**
 * 
 * 
 * @param {String} attr name
 */
Data.prototype.isDirty = function isDirty(attr) {
  return 
    (attr == null) ?
    !_.isEmpty(this._original) : 
    _.has(this._original, attr)
}

/**
 * Return a hash of dirty fields
 * 
 * @return {Object}
 */
Data.prototype.getDirty = function getDirty() {
  return _.pick(this._data, _.keys(this._original))
}