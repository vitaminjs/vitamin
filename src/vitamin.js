
var _ = require('underscore')
var Hooks = require('./hooks')
var mergeOptions = require('./helpers').mergeOptions

module.exports = Vitamin

/**
 * Vitamin model constructor
 * 
 * @constructor
 */
function Vitamin() { this.init.apply(this, arguments) }

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
Vitamin.extend = function extend(options) {
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
 * @param {Object} data
 */
Vitamin.prototype.init = function init(data) {
  this._initData(data)
}


// ---------------------------------------
// ------------ SETUP VITAMIN ------------
// ---------------------------------------

// options object alias
Object.defineProperty(Vitamin.prototype, '$options', {
  get: function getOptions() { return this.constructor.options }
})

// init hooks
Vitamin.hooks = new Hooks(Vitamin, false)

// use data API
Vitamin.use(require('./data/api'))

// use persistence API
Vitamin.use(require('./persistence/api'))