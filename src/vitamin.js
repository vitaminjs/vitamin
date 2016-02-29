
var _ = require('underscore')

var dataAPI = require('./api/data')
var eventsAPI = require('./api/events')
var persistenceAPI = require('./api/persistence')

/**
 * Helper to merge options from parent class to subclasses
 */
function mergeOptions(parent, child) {
  var options = _.extend({}, parent)
  
  if (! child ) return options
  if (! parent ) return child
  
  function mergeField(key, newVal, oldVal) {
    switch (key) {
      case 'events':
        return mergeEvents(newVal, oldVal)
      
      default: 
        return newVal
    }
  };
  
  function mergeEvents(to, from) {
    var events = _.extend({}, from)
    
    // for each event, push all callbacks into an array
    _.each(to, function(cb, e) {
      // using Array.concat() prevent copying references,
      // by returning a new array object
      events[e] = [].concat(events[e] || [], [cb])
    });
    
    return events
  };
  
  // iterate over child options
  _.each(child, function(val, key) {
    options[key] = mergeField(key, val, options[key])
  });
  
  return options
}

/**
 * Vitamin model constructor
 * 
 * @constructor
 */
var Vitamin = function Vitamin() { this.init.apply(this, arguments) }

/**
 * Default Vitamin options
 * 
 * @static
 */
Vitamin.options = {
  
  // model schema definition
  'schema': {},
  
  // primary key name
  'pk': "id"
  
}

/**
 * Set up correctly the prototype chain for subclasses
 * possible options
 *  * pk
 *  * schema
 *  * methods
 *  * adapter
 *  * events
 * 
 * @param {Object} inheritance options
 * 
 * @static
 */
Vitamin.extend = function extend(options) {
  var Super = this
  
  options = options || {}
    
  // Default constructor simply calls the parent constructor
  function Model() { Super.apply(this, arguments) }
  
  // Set the prototype chain to inherit from `parent`
  Model.prototype = Object.create(Super.prototype, { constructor: { value: Model } })
  
  // Add static and instance properties
  _.extend(Model, Super)
  _.extend(Model.prototype, options.methods)
  
  // merge options
  delete options.methods
  Model.options = mergeOptions(Super.options, options)
  
  // return the final product
  return Model
}

/**
 * 
 * 
 * @static
 */
Vitamin.factory = function factory(data, options) {
  var Self = this
  
  // data can be a primary key
  if ( _.isString(data) || _.isNumber(data) ) {
    var id = data
    
    (data = {})[this.options.pk] = id
  }
  
  return new Self(data, options)
}

/**
 * Use a plugin
 * 
 * @param {Function|Object} an object with `install` method, or simply a function
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
 * 
 */
Vitamin.prototype.init = function init(data, options) {
  // define model dynamic options
  Object.defineProperty(this, '$options', {
    value: mergeOptions(this.constructor.options, options)
  })
  
  // define a unique client identifier
  Object.defineProperty(this, '$cid', { value: _.uniqueId('___') })
  
  // register events
  this._initEvents(this.$options.events)
  
  // init model schema
  this._initSchema(this.$options.schema)
  
  // set data
  this._initData(data)
  
  // init storage adapter
  this._initAdapter(this.$options.adapter)
  
  // emit init end event
  this.emit('init', this)
}

// plugin usage
Vitamin
  .use(dataAPI)
  .use(eventsAPI)
  .use(persistenceAPI)

// done
module.exports = Vitamin