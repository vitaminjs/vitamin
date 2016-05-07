
var _ = require('underscore')

module.exports = Query

/**
 * Vitamin query builder constructor
 * 
 * @param {Object} model
 * @param {Object} driver
 */
function Query(model) {
  this._select = []
  this._from   = undefined
  this._where  = []
  this._order  = []
  this._skip   = undefined
  this._limit  = undefined
  
  this.setModel(model)
}

/**
 * 
 */
Object.defineProperty(Query.prototype, 'driver', {
  get: function getDriver() {
    var driver = this.model.constructor.driver
    
    if ( driver ) return driver
    
    throw "Undefined database driver"
  }
})

/**
 * 
 * 
 * @param {Object} model
 */
Query.prototype.setModel = function setModel(model) {
  this._from   = model.getOption('source')
  this.model   = model
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
  this._limit = Number(n)
  return this
}

/**
 * 
 */
Query.prototype.skip = function skip(n) {
  this._skip = Number(n)
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
  var model = this.model, 
      promise = this.driver.fetch(this.limit(1))
  
  function _mapOne(data) {
    return _.isEmpty(data) ? null : model.set(data)
  }
  
  return promise.then(_mapOne).nodeify(cb)
}

/**
 * 
 */
Query.prototype.fetchAll = function fetchAll(cb) {
  var ctor = this.model.constructor,
      factory = ctor.factory.bind(ctor),
      promise = this.driver.fetchAll(this)
  
  function _mapAll(list) {
    return _.map(list, factory)
  }
  
  return promise.then(_mapAll).nodeify(cb)
}

/**
 * 
 */
Query.prototype.insert = function insert(cb) {
  var model = this.model,
      data = this.model.data.serialize(),
      promise = this.driver.insert(this, data)
  
  function _handleInsert(id) {
    // TODO use last inserted id
    return model
  }
  
  return promise.then(_handleInsert).nodeify(cb)
}

/**
 * 
 */
Query.prototype.update = function update(cb) {
  var model = this.model,
      data = this.model.data.serialize(),
      promise = this.driver.update(this, data)
  
  return promise.then(function() { return model }).nodeify(cb)
}

/**
 * 
 */
Query.prototype.destroy = function remove(cb) {
  var model = this.model, 
      promise = this.driver.remove(this)
  
  return promise.then(function() { return model }).nodeify(cb)
}

/**
 * 
 * 
 * @return {Object}
 */
Query.prototype.assemble = function assemble() {
  var q = {}, key
  
  for ( key in ['select', 'from', 'where', 'order', 'skip', 'limit'] ) {
    if ( _.isEmpty(this['_' + key]) ) continue
    
    q[key] = _.clone(this['_' + key])
  }
  
  return q
}