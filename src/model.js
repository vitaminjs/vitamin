
var _ = require('underscore'),
    Hooks = require('./hooks')

module.exports = Model

/**
 * Model constructor
 * 
 * @constructor
 */
function Model() { this._init.apply(this, arguments) }

/**
 * Data source driver
 */
Model.prototype.$driver = undefined

/**
 * Model hooks manager
 */
Model.prototype.$hooks = new Hooks()

/**
 * Set up correctly the prototype chain for subclasses
 * 
 * @param {Object} props
 * @param {Object} statics
 * @static
 */
Model.extend = function extend(props, statics) {
  var Super = this
  
  // default constructor simply calls the parent one
  function Model() { Super.apply(this, arguments) }
  
  // set the prototype chain to inherit from `parent`
  Model.prototype = Object.create(Super.prototype, { 
    constructor: { value: Model } 
  })
  
  // add static and instance properties
  _.extend(Model, Super, statics)
  _.extend(Model.prototype, props)
  
  // init model hooks
  Model.prototype.$hooks = Super.prototype.$hooks.clone()
  
  return Model
}

/**
 * Use a plugin
 * 
 * @param {Function|Object} plugin object with `install` method, or simply a function
 * @return {Model}
 * @static
 */
Model.use = function use(plugin) {
  if ( plugin.installed === true ) return this
  
  var args = _.rest(arguments)
  
  // prepend Model as first argument
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
 * Factory function to instantiate new models without `new` operator
 * 
 * @param {Object} attrs
 * @return {Model}
 * @static
 */
Model.factory = function factory(attrs) { return new this(attrs) }

/**
 * Create and add a pre callback
 * 
 * @param {String} name
 * @param {Function} fn
 * @param {Boolean} _async
 * @return {Model}
 */
Model.pre = function pre(name, fn, _async) {
  this.prototype.$hooks.pre(name, fn, _async)
  return this
}

/**
 * Create and add a post callback
 * 
 * @param {String} name
 * @param {Function} fn
 * @return {Model}
 */
Model.post = function post(name, fn) {
  this.prototype.$hooks.post(name, fn)
  return this
}

/**
 * Fill the model data
 * 
 * @param {object} attrs
 * @return {Model} instance
 */
Model.prototype.fill = function fill(attrs) {
  for ( var name in attrs ) { 
    this.set(name, attrs[name])
  }
  
  return this
}

/**
 * Set the model data without any checking
 * 
 * @param {Object} data
 * @param {Boolean} sync
 * @return {Model} instance
 */
Model.prototype.setData = function setData(data, sync) {
  this.$data = data
  
  // sync original attributes with current state
  if ( sync === true ) this._syncOriginal()
  
  return this
}

/**
 * Set model's attribute value
 * 
 * @param {String} attr
 * @param {any} newVal
 * @return {Model} instance
 */
Model.prototype.set = function set(attr, newVal) {
  if ( _.isEmpty(attr) ) return this
  
  // TODO use attribute setter if available
  
  // set the new value
  this.$data[attr] = newVal
  
  return this
}

/**
 * Get the value of an attribute
 * 
 * @param {String} attr name
 * @param {any} defaultValue
 * @return {any}
 */
Model.prototype.get = function get(attr, defaultValue) {
  // TODO use attribute getter if available
  return this.$data[attr] || defaultValue
}

/**
 * Set primary key value
 * 
 * @param {any} id
 * @return {Model} instance
 */
Model.prototype.setId = function setId(id) {
  return this.set(this.getKeyName(), id)
}

/**
 * Get the primary key value
 * 
 * @return {any}
 */
Model.prototype.getId = function getId() {
  return this.get(this.getKeyName())
}

/**
 * Get the primary key field name
 * 
 * @return {String}
 */
Model.prototype.getKeyName = function getKeyName() {
  return "id"
}

/**
 * Get table or collection name
 * 
 * @return {String}
 */
Model.prototype.getSourceName = function getSourceName() {
  return undefined
}

/**
 * Determine if an attribute exists on the model
 * 
 * @param {String} attr
 * @return {Boolean}
 */
Model.prototype.has = function has(attr) {
  return !_.isUndefined(this.get(attr))
}

/**
 * Return a hash of dirty fields
 * 
 * @return {Object}
 */
Model.prototype.getDirty = function getDirty() {
  return _.pick(this.$data, function(val, attr) {
    return !_.has(this.$original, attr) || val !== this.$original[attr]
  }, this)
}

/**
 * Determine if the model or given attribute have been modified
 * 
 * @param {String} attr (optional)
 * @return {Boolean}
 */
Model.prototype.isDirty = function isDirty(attr) {
  var dirty = this.getDirty()
  
  return attr ? _.has(dirty, attr) : !_.isEmpty(dirty)
}

/**
 * @return {Object}
 */
Model.prototype.toJSON = function toJSON() {
  // TODO omit hidden fields
  return _.clone(this.$data)
}

/**
 * Called by the constructor to init the new instance
 * 
 * @param {Object} attrs
 * @private
 */
Model.prototype._init = function _init(attrs) {
  this.$data = {}
  this.$original = {}
  
  // set model attributes
  this.fill(attrs)
}

/**
 * Sync the original attributes with the current
 */
Model.prototype._syncOriginal = function _syncOriginal() {
  this.$original = _.clone(this.$data)
}