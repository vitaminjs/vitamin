
var _ = require('underscore')
var Hooks = require('./hooks')
var Query = require('./query')
var DataClass = require('./data')

module.exports = Model

/**
 * Model constructor
 * 
 * @constructor
 */
function Model() { this.init.apply(this, arguments) }

/**
 * Default options
 * 
 * @static
 * @private
 */
Model._options = {
  
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
 * Model hooks
 * 
 * @static
 * @private
 */
Model._hooks = new Hooks(Model)

/**
 * Data source driver adapter
 * 
 * @static
 * @private
 */
Model._driver = undefined

/**
 * Factory function to instantiate new models without `new` operator
 * 
 * @param {Object} data
 * 
 * @static
 */
Model.factory = function factory(attributes) {
  return new this(attributes || {})
}

/**
 * Set up correctly the prototype chain for subclasses
 * 
 * @param {Object} options
 * 
 * @static
 */
Model.extend = function extend(options) {
  var Super = this
      options = options || {}
  
  // default constructor simply calls the parent constructor
  function Model() { Super.apply(this, arguments) }
  
  // set the prototype chain to inherit from `parent`
  Model.prototype = Object.create(Super.prototype, { constructor: { value: Model } })
  
  // add static and instance properties
  _.extend(Model, Super, options.statics)
  _.extend(Model.prototype, options.methods)
  
  // merge options
  Model._options = mergeOptions(Super._options, options)
  
  // init the model hooks
  Model._hooks = Super._hooks.clone(Model)
  
  // return the final product
  return Model
}

/**
 * Use a plugin
 * 
 * @param {Function|Object} plugin object with `install` method, or simply a function
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
 * 
 */
Model.pre = function pre(name, fn, async) {
  if ( name === 'init' ) {
    // creating hooks for `init` method prevent handling errors,
    // because it is invoked automaticaly by the constructor
    throw "`init` method cannot accept pre callbacks"
  }
  
  this._hooks.create(name).pre(name, fn, async)
  return this
}

/**
 * 
 */
Model.post = function post(name, fn) {
  this._hooks.create(name).post(name, fn)
  return this
}

/**
 * 
 */
Object.defineProperty(Model.prototype, 'data', {
  get: function getData() {
    return this._data
  }
})

/**
 * Called by the constructor when creating a new instance
 * 
 * @param {Object} attributes
 */
Model.prototype.init = function init(attributes) {
  this._initData(attributes)
}

/**
 * Get model option by name
 * 
 * @param {String} name
 * @param {Mixed} defaults optional
 */
Model.prototype.getOption = function getOption(name, defaults) {
  return _.result(this.constructor._options, name, defaults)
}

/**
 * Return the primary key name
 * 
 * @return {String}
 */
Model.prototype.getKeyName = function getKeyName() {
  return this.getOption('pk')
}

/**
 * Identifier getter
 */
Model.prototype.getId = function getId() { 
  return this.get(this.getKeyName())
}

/**
 * Identifier setter
 */
Model.prototype.setId = function setId(id) {
  this.set(this.getKeyName(), id)
  return this
}

/**
 * Set model attributes
 */
Model.prototype.set = function set(key, val) {
  if ( _.isObject(key) ) this.data.fill(key)
  else this.data.set(key, val)
  return this
}

/**
 * Get the value of an attribute.
 * 
 * @param {String} attr name
 */
Model.prototype.get = function get(attr) {
  return this.data.get(attr)
}

/**
 * @param {String} attr name
 */
Model.prototype.has = function has(attr) {
  return this.data.has(attr)
}

/**
 * 
 */
Model.prototype.isNew = function isNew() {
  return !this.has(this.getKeyName())
}

/**
 * 
 */
Model.prototype.toJSON = function toJSON() {
  return this.data.toJSON()
}

/**
 * @param {String} attr name
 */
Model.prototype.isDirty = function isDirty(attr) {
  return this.data.isDirty(attr)
}

/**
 * 
 */
Model.prototype.getDirty = function getDirty() {
  return this.data.getDirty()
}

/**
 * 
 */
Model.prototype.serialize = function serialize() {
  return this.data.serialize()
}

/**
 * Get all models from database
 * 
 * @param {Object} where
 * @param {Function} cb
 * 
 * @static
 */
Model.all = function all(cb) {
  return this.factory().newQuery().fetchAll(cb)
}

/**
 * Find a model by its primary key
 * 
 * @param {Mixed} id
 * @param {Function} cb
 * 
 * @static
 */
Model.find = function find(id, cb) {
  return this.where(this._options.pk, id).fetch(cb)
}

/**
 * 
 * @param {String|Object} key attribute name or constraints object
 * @param {Mixed} value attribute value
 * 
 * @return Query
 */
Model.where = function where(key, value) {
  return this.factory().newQuery().where(key, value)
}

/**
 * Create and save a new model
 * 
 * @param {Object} data object
 * @param {Function} callback
 * 
 * @static
 */
Model.create = function create(data, cb) {
  return this.factory(data).save(cb)
}

/**
 * Fetch fresh data from database
 * 
 * @param {Function} callback
 */
Model.prototype.fetch = function fetch(cb) {
  var pk = this.getKeyName()
  
  return this.newQuery().where(pk, this.getId()).fetch(cb)
}

/**
 * Save the model attributes
 * 
 * @param {Function} callback
 */
Model.prototype.save = function save(cb) {
  return this.isNew() ? this.insert(cb) : this.update(cb)
}

/**
 * Destroy the model
 * 
 * @param {Function} callback
 */
Model.prototype.destroy = function destroy(cb) {
  return this.newQuery().destroy(cb)
}

/**
 * 
 */
Model.prototype.insert = function insert(cb) {
  return this.newQuery().insert(cb)
}

/**
 * 
 */
Model.prototype.update = function update(cb) {
  return this.newQuery().update(cb)
}

/**
 * Create a new query for the provided model
 * 
 * @return Query builder object
 */
Model.prototype.newQuery = function newQuery() {
  return new Query(this, this.constructor._driver)
}

/**
 * Setup model's data
 * 
 * @private
 */
Model.prototype._initData = function _initData(attributes) {
  this._data = new DataClass(this, attributes || {})
}

// HELPERS --------------------------------------------------------------------

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