
var _ = require('underscore')
var Promise = require('bluebird')

module.exports = Events

/**
 * Event dispatcher constructor
 */
function Events() {
  this.parent = null
  this.listeners = {}
}

/**
 * Add a handler for the given event name
 * 
 * @param {String} event
 * @param {Function} fn
 */
Events.prototype.on = function on(event, fn) {
  var list = (this.listeners[event] = this.listeners[event] || [])
  
  list.push(fn)
  return this
}

/**
 * Remove an event handler
 * 
 * @param {String} event
 * @param {Function} fn
 */
Events.prototype.off = function off(event, fn) {
  // call parent's off method to remove ancestor callbacks
  if ( this.parent ) this.parent.off(event, fn)
  
  if (! event ) {
    // if no event defined, erase all
    this.listeners = {}
  }
  else if (! fn ) {
    // remove all event listeners
    this.listeners[event] = []
  }
  else {
    // search and unset the callback
    _.any(this.listeners[event], function(cb, i, list) {
      if ( cb === fn ) {
        list.splice(i, 1)
        return true
      } 
      
      return false
    })
  }
  
  return this
}

/**
 * Trigger an event with parameters
 * 
 * @param {String} event
 * @return {Promise}
 */
Events.prototype.emit = function emit(event) {
  var args = _.rest(arguments),
      listeners = this.getListeners(event)
  
  return Promise.map(listeners, function (fn) {
    return fn.apply(null, args)
  })
}

/**
 * Clone and return a new instance
 * 
 * @return {Events}
 */
Events.prototype.clone = function clone() {
  var obj = new Events()
  
  // just define the parent property,
  // to get access to parent listeners
  obj.parent = this
  
  return obj
}

/**
 * Get all event listeners
 * 
 * @param {String} event
 */
Events.prototype.getListeners = function getListeners(event) {
  var list = []
  
  if ( this.parent ) list = parent.getListeners(event)
  
  return list.concat(this.listeners[event] || [])
}