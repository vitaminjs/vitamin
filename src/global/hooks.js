
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
    var hooks = this.constructor._hooks
    
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
 * 
 */
function _wrap(hooks, name, fn, context, args) {
  var 
    useCallback = _.isFunction(_.last(args)),
    callback = useCallback ? args.pop() : null,
    promise = _pre(hooks.pres[name] || [], context, args)
    
  return promise
    .then(function () {
      if ( useCallback ) fn = Promise.denodeify(fn)
        
      return fn.apply(context, args)
    })
    .then(function(result) {
      _post(hooks.posts[name] || [], context, [result])
      
      return result
    })
    .nodeify(callback)
}

/**
 * call pre callbacks
 */
function _pre(pres, context, args) {
  var i = -1, asyncPresLeft = pres.numAsync || 0
  
  return new Promise(function(resolve, reject) {
    function next() {
      var pre = pres[++i]
      
      // No available pre callbacks
      if ( !pre ) return asyncPresLeft ? void 0 : resolve()
      
      if ( pre.async === true )
        pre.apply(context, [_next, _done].concat(args))
      else
        pre.apply(context, [_next].concat(args))
    }
    
    function _next(err) {
      if ( err ) reject(err)
      else next()
    }
    
    function _done(err) {
      if ( err ) return reject(err)
      if ( --asyncPresLeft === 0 ) resolve()
    }
    
    next()
  })
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