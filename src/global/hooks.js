
var Kareem = require('kareem')
var slice = Array.prototype.slice

module.exports = Hooks

/**
 * 
 */
function Hooks(model, manager) {
  this.proto = model.prototype || model
  this.manager = manager || new Kareem()
}

/**
 * 
 */
Hooks.prototype.pre = function pre() {
  this.manager.pre.apply(this.manager, arguments)
  return this
}

/**
 * 
 */
Hooks.prototype.post = function post() {
  this.manager.post.apply(this.manager, arguments)
  return this
}

/**
 * Create a new hook for the target function
 * 
 * @param {String} name
 * @param {Boolean} useLegacyPost
 * 
 * @see Kareem#wrap()
 */
Hooks.prototype.create = function create(name, useLegacyPost) {
  var fn = this.proto[name]
  
  // no function found in prototype
  // may be we should throw an Error !
  if (! fn ) return this
  
  // prevent rehook the same method
  if ( fn._hooked === true ) return this
  
  function fnWrapper() {
    var 
      args = slice.call(arguments),
      manager = this.constructor.hooks.manager
    
    return manager.wrap(name, fn, this, args, useLegacyPost)
  }
  
  fnWrapper._hooked = true
  this.proto[name] = fnWrapper
  
  return this
}

/**
 * 
 */
Hooks.prototype.clone = function clone(model) {
   return new Hooks(model, this.manager.clone())
}