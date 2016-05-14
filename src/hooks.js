
var Promise = require('bluebird')
var _ = require('underscore')

module.exports = Hooks

/**
 * 
 */
function Hooks(model) {
  this.pres = {}
  this.posts = {}
  this._proto = model.prototype || model
}

/**
 * 
 */
Hooks.prototype.pre = function pre(name, fn, isAsync) {
  var pres = (this.pres[name] = this.pres[name] || [])
  
  // increment async callbacks count
  if ( isAsync === true ) {
    pres.numAsync = pres.numAsync || 0
    pres.numAsync++
    fn.isAsync = true
  }
  
  // add the pre callback
  pres.push(fn);
  
  return this
}

/**
 * 
 * 
 * @return {Promise}
 */
Hooks.prototype.callPres = function callPres(name, context, args) {
  var current = 0,
      pres = this.pres[name] || [], 
      asyncPresLeft = pres.numAsync || 0
  
  return new Promise(function (resolve, reject) {
    function next() {
      var pre = pres[current++]
      
      // No available pre callbacks
      if (! pre ) return asyncPresLeft ? void 0 : resolve()
      
      if ( pre.isAsync === true )
        pre.apply(context, [_next, _done].concat(args))
      else
        pre.apply(context, [_next].concat(args))
    }
    
    function _next(error) {
      if ( error ) reject(error)
      else next()
    }
    
    function _done(error) {
      if ( error ) reject(error)
      else if ( --asyncPresLeft === 0 ) resolve()
    }
    
    next()
  })
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
 * 
 * 
 * @return {Promise}
 */
Hooks.prototype.callPosts = function callPosts(name, context, args) {
  var posts = this.posts[name] || []
  
  return new Promise(function (resolve) {
    // iterate over post callbacks
    _.each(posts, function(post) { 
      post.apply(context, args) 
    })
    
    // instead of returning a resolved promise here,
    // we resolve this one to make easy stopping posts,
    // by simply throwing errors
    resolve()
  })
}

/**
 * Create a new hook for the target function
 * 
 * @param {String} name
 */
Hooks.prototype.create = function create(name) {
  var fn = this._proto[name]
  
  // TODO we may throw an error if the function is undefined
  if (! fn ) return this
  
  // prevent rehook the same method
  if ( fn._hooked === true ) return this
  
  function fnWrapper() {
    var hooks = this.constructor.hooks
    
    return _wrap(hooks, name, fn, this, _.toArray(arguments))
  }
  
  fnWrapper._hooked = true
  this._proto[name] = fnWrapper
  
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
  var useCallback = _.isFunction(_.last(args)),
      callback = useCallback ? args.pop() : null
    
  return hooks
    .callPres(name, context, args)
    .then(function () {
      if ( useCallback ) fn = Promise.promisify(fn)
      
      return fn.apply(context, args)
    })
    .tap(function(result) {
      return hooks.callPosts(name, context, [result])
    })
    .nodeify(callback)
}