/* global process */

var Promise = require('promise')
var _ = require('underscore')

module.exports = Hooks

/**
 * 
 */
function Hooks(model) {
  this.pres = {}
  this.posts = {}
  this.proto = model.prototype || model
}

/**
 * 
 */
Hooks.prototype.pre = function pre(name, async, fn) {
  var pres = (this.pres[name] = this.pres[name] || [])
  
  if ( _.isFunction(async) ) {
    fn = async
    async = false
  }
  
  // increment async callbacks count
  if ( async === true ) {
    pres.numAsync = pres.numAsync || 0
    pres.numAsync++
    fn.async = true
  }
  
  // add the pre callback
  pres.push(fn);
  
  return this
}

/**
 * 
 */
Hooks.prototype.post = function post(name, fn) {
  var posts = (this.posts[name] = this.posts[name] || [])
  
  // add the post callback
  posts.push(fn)
  
  return this
}

/**
 * Create a new hook for the target function
 * 
 * @param {String} name
 */
Hooks.prototype.create = function create(name) {
  var fn = this.proto[name]
  
  // TODO we may throw an error if the function is undefined
  if (! fn ) return this
  
  // prevent rehook the same method
  if ( fn._hooked === true ) return this
  
  function fnWrapper() {
    var hooks = this.constructor.hooks
    
    return _wrap(hooks, name, fn, this, _.toArray(arguments))
  }
  
  fnWrapper._hooked = true
  this.proto[name] = fnWrapper
  
  return this
}

/**
 * 
 */
Hooks.prototype.clone = function clone(model) {
  var key, o = new Hooks(model)
  
  for ( key in this.pres ) {
    o.pres[key] = this.pres[key].slice()
  }
  
  for ( key in this.posts ) {
    o.posts[key] = this.posts[key].slice()
  }
  
  return o
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
  
  name = name.replace(/^(pre:|post:)/i, '')
  
  // remove pre callbacks
  if ( isPre ) _remove(this.pres, name, fn)
  
  // remove post callbacks
  if ( isPost ) _remove(this.posts, name, fn)
  
  return this
}

/**
 * 
 */
function _wrap(hooks, name, fn, context, args) {
  var useCallback = _.isFunction(_.last(args))
  var callback = useCallback ? args.pop() : null
  
  _pre(hooks.pres[name] || [], context, args, function (err) {
    if ( err ) return useCallback ? callback(err) : null
    
    fn.apply(context, args.concat(function(err, result) {
      if ( useCallback ) callback(err, result)
      
      if (! err ) _post(hooks.posts[name] || [], context, [result])
    }))
  })
}

/**
 * call pre callbacks
 */
function _pre(pres, context, args, callback) {
  var 
    asyncPresLeft = pres.numAsync || 0, 
    i = -1, done = false
  
  function next() {
    var pre = pres[++i]
    
    // No available pre callbacks
    if ( !pre ) return asyncPresLeft ? void 0 : callback()
    
    if ( pre.async === true )
      pre.apply(context, [_next, _done].concat(args))
    else
      pre.apply(context, [_next].concat(args))
  }
  
  function _next(err) {
    if ( err ) _error(err)
    else next()
  }
  
  function _done(err) {
    if ( err ) _error(err)
    else if ( --asyncPresLeft === 0 ) callback()
  }
  
  function _error(e) {
    if (! done ) {
      done = true
      callback(e)
    }
  }
  
  next()
}

/**
 * call post callbacks
 */
function _post(posts, context, args) {
  var i = 0
  
  function next() {
    var post = posts[i++]
    
    if ( post ) {
      post.apply(context, args)
      next()
    }
  }
  
  next()
}

/**
 * remove all or specific callback from the hash 
 */
function _remove(source, name, fn) {
  if (! source[name] ) return
  
  if (! fn ) { delete source[name]; return }
  
  source[name].forEach(function(cb, idx, list) {
    if ( fn === cb ) list.splice(idx, 1)
  })
}