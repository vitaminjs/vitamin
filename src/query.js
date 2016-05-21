
var Promise = require('bluebird')
var _ = require('underscore')

module.exports = Query

/**
 * Vitamin query builder constructor
 * 
 * @param {Object} model
 */
function Query(model) {
  this._select = []
  this._where  = []
  this._order  = []
  this._skip   = undefined
  this._limit  = undefined
  this._from   = model.getSourceName()
  
  // make `model` and `driver` properties private
  Object.defineProperties(this, {
    'model': { value: model },
    'driver': { value: model.getDriver() }
  })
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
  
  this._select = _.uniq(this._select.concat(args))
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
  
  this._order = _.uniq(this._order.concat(args))
  return this
}

/**
 * 
 */
Query.prototype.fetch = function fetch(cb) {
  var pending = this.driver.fetch(this.limit(1).assemble())
  
  function _mapOne(data) {
    return _.isEmpty(data) ? Promise.reject(null) : this.model.fill(data)
  }
  
  return Promise.bind(this).resolve(pending).then(_mapOne).nodeify(cb)
}

/**
 * 
 */
Query.prototype.fetchAll = function fetchAll(cb) {
  var pending = this.driver.fetchAll(this.assemble())
  
  function _mapAll(list) {
    var Model = this.model.constructor
    
    return _.map(list, Model.factory.bind(Model))
  }
  
  return Promise.bind(this).resolve(pending).then(_mapAll).nodeify(cb)
}

/**
 * 
 */
Query.prototype.insert = function insert(data) {
  return this.driver.insert(data, this.assemble())
}

/**
 * 
 */
Query.prototype.update = function update(data) {
  return this.driver.update(data, this.assemble())
}

/**
 * 
 */
Query.prototype.destroy = function destroy(cb) {
  return this.driver.destroy(this.assemble())
}

/**
 * 
 * 
 * @return {Object}
 */
Query.prototype.assemble = function assemble() {
  var q = {}, 
      props = ['select', 'from', 'where', 'order', 'skip', 'limit']
  
  _.each(props, function _assemblePieces(name) {
    var prop = this['_' + name]
    
    if (! _.isEmpty(prop) ) q[name] = _.clone(prop)
  }, this)
  
  return q
}