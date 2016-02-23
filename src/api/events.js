
var _ = require('underscore')
var EventEmitter = require('events')

function eventsAPI(Model) {
  
  /**
   * 
   */
  Model.prototype.on = function on(event, callback) {
    this.$emitter.on(event, callback)
    return this
  }
  
  /**
   * 
   */
  Model.prototype.once = function once(event, callback) {
    this.$emitter.once(event, callback)
    return this
  }
  
  /**
   * 
   */
  Model.prototype.off = function off(event, callback) {
    if (! callback ) this.$emitter.removeAllListeners(event)
    else this.$emitter.removeListener(event, callback)
    
    return this
  }
  
  /**
   * 
   */
  Model.prototype.emit = function emit(event) {
    this.$emitter.emit.apply(this.$emitter, arguments)
    return this
  }
  
  /**
   * 
   * @private
   */
  Model.prototype._initEvents = function _initEvents(events) {
    var model = this
    
    // define model event emitter
    Object.defineProperty(this, '$emitter', { value: new EventEmitter() })
    
    function register(cbs, event) {
      _.each(cbs, function(fn) {
        if ( _.isString(fn) ) fn = model[fn]
        
        if (! _.isFunction(fn) ) return
        
        model.on(event, fn.bind(model))
      })
    }
    
    _.each(events, register);
  }
  
}

module.exports = eventsAPI