
var Promise = require('bluebird')
var _ = require('underscore')

module.exports = Hooks

/**
 * 
 */
function Hooks() {
  this.pres = {}
  this.posts = {}
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
 * 
 */
Hooks.prototype.clone = function clone(model) {
  var key, o = new Hooks()
  
  for ( key in this.pres ) {
    o.pres[key] = this.pres[key].slice()
  }
  
  for ( key in this.posts ) {
    o.posts[key] = this.posts[key].slice()
  }
  
  return o
}