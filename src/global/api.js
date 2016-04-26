
var _ = require('underscore')
var Hooks = require('./hooks')

module.exports = globlaAPI

function globlaAPI(Model) {

  /**
   * Vitamin hooks
   * 
   * @static
   */ 
  Model.hooks = new Hooks(Model)
  
  /**
   * Vitamin default options
   * 
   * @static
   */
  Model.options = {
    
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
    
    // database driver adapter
    'driver': undefined,
    
    // data class constructor
    'dataClass': undefined,
    
  }

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
    Model.options = mergeOptions(Super.options, options)
    
    // init the model hooks
    Model.hooks = Super.hooks.clone(Model)
    
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
   * Called by the constructor when creating a new instance
   * 
   * @param {Object} data
   */
  Model.prototype.init = function init(data) {
    this._initData(data)
  }
  
  /**
   * Get model option by name
   * 
   * @param {String} name
   * @param {Mixed} defaults optional
   */
  Model.prototype.getOption = function getOption(name, defaults) {
    // we cannot use `_.result()` here,
    // because a function or constructor can be
    // provided as model option.
    return this.constructor.options[name] || defaults
  }
  
  /**
   * Return the primary key name
   * 
   * @return {String}
   */
  Model.prototype.getKeyName = function getKeyName() {
    return this.getOption('pk')
  }
  
}

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