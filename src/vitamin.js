
var _ = require('underscore')

module.exports = Vitamin

/**
 * Vitamin model constructor
 * 
 * @constructor
 */
function Vitamin(attributes) { this.init(attributes) }

/**
 * Vitamin default options
 * 
 * @static
 */
Vitamin.options = {
  
  // primary key name
  'pk': "id",
  
  // model schema definition
  'schema': {},
  
  // instance methods
  'methods': {},
  
  // static methods
  'statics': {},
  
  // table or collection name
  'source': undefined,
  
}

/**
 * Factory function to instantiate new models without `new` operator
 * 
 * @param {Object} data
 * 
 * @static
 */
Vitamin.factory = function factory(attributes) {
  return new this(attributes || {})
}

/**
 * Set up correctly the prototype chain for subclasses
 * 
 * @param {Object} options
 * 
 * @static
 */
Vitamin.extend = function extend(options = {}) {
  var Super = this
  
  // Default constructor simply calls the parent constructor
  function Model() { Super.apply(this, arguments) }
  
  // Set the prototype chain to inherit from `parent`
  Model.prototype = Object.create(Super.prototype, { constructor: { value: Model } })
  
  // Add static and instance properties
  _.extend(Model, Super, options.statics)
  _.extend(Model.prototype, options.methods)
  
  // merge options
  options = _.omit(options, 'methods', 'statics')
  Model.options = _.extend(Super.options, options)
  
  // return the final product
  return Model
}

/**
 * Use a plugin
 * 
 * @param {Function|Object} plugin object with `install` method, or simply a function
 * 
 * @static
 */
Vitamin.use = function use(plugin) {
  if ( plugin.installed === true ) return this
  
  var args = _.rest(arguments)
  
  // prepend Vitamin as first argument
  args.unshift(this)
  
  if ( _.isFunction(plugin.install) ) {
    plugin.install.apply(null, args)
  }
  else if ( _.isFunction(plugin) ) {
    plugin.apply(null, args)
  }
  
  // prevent reuse the same plugin next time
  plugin.installed = true
  
  return this
}

/**
 * Called by the constructor when creating a new instance
 * 
 * @param {Object} attributes
 */
Vitamin.prototype.init = function init(attributes) {
  // define model properties
  Object.defineProperty(this, '$data', { value: {} })
  Object.defineProperty(this, '$original', { value: {} })
  Object.defineProperty(this, 'id', { 
    get: function ID() { return this.get(this.option('pk')) }
  })
  
  this._initSchema()
  
  this.set(attributes)
}

/**
 * Retrieve an option by name
 * 
 * @param {String} name
 * @param {Mixed} defaults
 */
Vitamin.prototype.option = function option(name, defaults) {
  return _.result(this.constructor.options, name, defaults)
}

/**
 * Set model attributes
 */
Vitamin.prototype.set = function set(attr, val) {
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
Vitamin.prototype.get = function get(attr) {
  return this.$data[attr]
}

/**
 * 
 * 
 * @param {String} attr name
 */
Vitamin.prototype.has = function has(attr) {
  return !_.isUndefined(this.get(attr))
}

/**
 * 
 */
Vitamin.prototype.isNew = function isNew() {
  return !this.has(this.option('pk'))
}

/**
 * 
 */
Vitamin.prototype.toJSON = function toJSON() {
  return _.clone(this.$data)
}

/**
 * 
 * 
 * @param {String} attr name
 */
Vitamin.prototype.isDirty = function isDirty(attr) {
  return 
    (attr == null) ?
    !_.isEmpty(this.$original) : 
    _.has(this.$original, attr)
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
Vitamin.prototype._set = function _set(key, newVal) {
  var oldVal = this.$data[key]
  
  // if no changes, return false
  if ( oldVal === newVal ) return false
  
  // set the new value
  this.$data[key] = newVal
  
  // set original value
  if (! _.isUndefined(oldVal) ) this.$original[key] = oldVal
}

/**
 * Normalize schema object and set default attributes
 * 
 * @private
 */
Vitamin.prototype._initSchema = function _initSchema() {
  var schema = this.option('schema')
  
  _.each(schema, function(options, name) {
    // normalize schema object format
    if ( _.isFunction(options) ) {
      schema[name] = { 'type': options }
    }
    
    // set attribute default value
    if ( _.has(options, 'default') ) {
      this.set(name, options.default)
    }
  }, this)
}

// use persistence API
Vitamin.use(require('./persistence/api'))