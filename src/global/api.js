
var _ = require('underscore')
var Hooks = require('./hooks')

module.exports = globlaAPI

function globlaAPI(Model) {
  
  /**
   * Database driver adapter
   */
  Model.driver = undefined

  /**
   * Vitamin hooks
   * 
   * @static
   * @private
   */ 
  Model._hooks = new Hooks(Model)
  
  /**
   * Vitamin default options
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
    if ( name !== 'init' ) this._hooks.create(name)
    
    this._hooks.post(name, fn)
    return this
  }

  /**
   * Called by the constructor when creating a new instance
   * 
   * @param {Object} data
   */
  Model.prototype.init = function init(data) {
    this._initData(data)
    
    this.constructor._hooks.callPosts('init', this, arguments)
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