
var Kareem = require('kareem')
var _ = require('underscore')

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
Hooks.prototype.pre = function pre(name, async, fn) {
  this.manager.pre(name, async, fn)
  return this
}

/**
 * 
 */
Hooks.prototype.post = function post(name, fn) {
  this.manager.post(name, fn)
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
      args = _.toArray(arguments), 
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

/**
 * remove("name", [fn])
 * remove("pre:name", [fn])
 * remove("post:name", [fn])
 * 
 * @param {String} name
 * @param {Function} fn optional
 */
Hooks.prototype.remove = function remove(name, fn) {
  var isPre = name.indexOf('post:') !== 0
  var isPost = name.indexOf('pre:') !== 0
  
  function _remove(source, name, fn) {
    if (! source[name] ) return
    
    if (! fn ) { delete source[name]; return }
    
    source[name].forEach(function(cb, idx, list) {
      if ( fn === cb ) list.splice(idx, 1)
    })
  }
  
  name = name.replace(/^(pre:|post:)/i, '')
  
  // remove pre callbacks
  if ( isPre ) _remove(this.manager._pres, name, fn)
  
  // remove post callbacks
  if ( isPost ) _remove(this.manager._posts, name, fn)
  
  return this
}