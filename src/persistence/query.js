
var _ = require('underscore')

module.exports = Query

/**
 * Vitamin query builder constructor
 * 
 * @param {Object} model
 * @param {Object} driver
 */
function Query(model, driver) {
  this._select = []
  this._from   = undefined
  this._where  = []
  this._order  = []
  this._skip   = 0
  this._limit  = 50
  
  this.setModel(model)
  this.setDriver(driver)
}

/**
 * 
 * 
 * @param {Object} model
 */
Query.prototype.setModel = function setModel(model) {
  this.from(model.getOption('source'))
  this._model = model
  return this
}

/**
 * 
 */
Query.prototype.setDriver = function setDriver(driver) {
  this._driver = driver
  return this
}

/**
 * 
 * 
 * where('name', "John")
 * where({ name: "Rita", age: 18 })
 * where('status', { $ne: "draft" })
 * where('price', { $gt: 100, $lte: 200 })
 * 
 * 
 */
Query.prototype.where = function where(key, val) {
  if ( key ) {
    var cond = {}
    
    if ( _.isObject(key) ) cond = key
    else cond[key] = val
    
    this._where.push(cond)
  }
  
  return this
}

/**
 * 
 * 
 * @param {Object} args
 */
Query.prototype.orWhere = function orWhere() {
  return this.where({ $or: _.toArray(arguments) })
}

/**
 * 
 */
Query.prototype.from = function from(from) {
  this._from = from
  return this
}

/**
 * 
 */
Query.prototype.select = function select() {
  var args = _.toArray(arguments)
  
  this._select = _.compact(this._select.concat(args))
  return this
}

/**
 * 
 */
Query.prototype.take = function take(n) {
  this._limit = n
  return this
}

/**
 * 
 */
Query.prototype.skip = function skip(n) {
  this._skip = n
  return this
}

/**
 * 
 */
Query.prototype.order = function order() {
  var args = _.toArray(arguments)
  
  this._order = _.compact(this._order.concat(args))
  return this
}

/**
 * 
 */
Query.prototype.fetch = function fetch(cb) {
  var promise, model = this._model
  
  promise = this._driver.fetch(this).then(function(data) {
    return model.set(data)
  })
  
  // if a callback is provided, use it
  if (! _.isFunction(cb) ) return promise
  else promise.then(function(result) { cb(null, result) }, cb)
}

/**
 * 
 */
Query.prototype.fetchAll = function fetchAll(cb) {
  var
    promise,
    ctor = this._model.constructor,
    factory = ctor.factory.bind(ctor)
  
  promise = this._driver.fetchAll(this).then(function(list) {
    return _.map(list, factory)
  })
  
  // if a callback is provided, use it
  if (! _.isFunction(cb) ) return promise
  else promise.then(function(result) { cb(null, result) }, cb)
}

/**
 * 
 */
Query.prototype.insert = function insert(cb) {
  var 
    promise, 
    model = this._model,
    data = this._model.data.serialize()
  
  promise = this._driver.insert(this, data).then(function() {
    // TODO use last inserted id
    return model
  })
  
  // if a callback is provided, use it
  if (! _.isFunction(cb) ) return promise
  else promise.then(function(result) { cb(null, result) }, cb)
}

/**
 * 
 */
Query.prototype.update = function update(cb) {
  var 
    promise, model = this._model,
    data = this._model.data.serialize()
  
  promise = this._driver.update(this, data).then(function() {
    return model
  })
  
  // if a callback is provided, use it
  if (! _.isFunction(cb) ) return promise
  else promise.then(function(result) { cb(null, result) }, cb)
}

/**
 * 
 */
Query.prototype.destroy = function remove(cb) {
  var promise, model = this._model
  
  promise = this._driver.remove(this).then(function() {
    return model
  })
  
  if (! _.isFunction(cb) ) return promise
  else promise.then(function(result) { cb(null, result) }, cb)
}

/**
 * 
 * @return {Object}
 */
Query.prototype.assemble = function assemble() {
  return {
    select: this._select,
    from:   this._from,
    where:  this._where,
    order:  this._order,
    offset: this._skip,
    limit:  this._limit
  }
}