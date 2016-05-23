
var Promise = require('bluebird')
var _ = require('underscore')

module.exports = Query

/**
 * Vitamin query builder constructor
 * 
 * @param {Object} driver
 */
function Query(driver) {
  this._select = []
  this._where  = []
  this._order  = []
  this._skip   = undefined
  this._limit  = undefined
  this._from   = undefined
  
  // make `driver` property private
  Object.defineProperty(this, 'driver', { value: driver })
}

/**
 * Add a basic where clause to the query
 * use cases:
 *   where('name', "John")
 *   where({ name: "Rita", age: 18 })
 *   where('status', { $ne: "draft" })
 *   where('price', { $gt: 100, $lte: 200 })
 * 
 * @return {Query} instance
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
 * Add an "or where" clause to the query
 * 
 * @param {Array} clauses
 * @return {Query} instance
 */
Query.prototype.orWhere = function orWhere(clauses) {
  return this.where({ $or: _.toArray(arguments) })
}

/**
 * Set the source name which the query is targeting
 * 
 * @return {Query} instance
 */
Query.prototype.from = function from(from) {
  this._from = from
  return this
}

/**
 * Set the fields to be selected
 * 
 * @return {Query} instance
 */
Query.prototype.select = function select() {
  var args = _.toArray(arguments)
  
  this._select = _.uniq(this._select.concat(args))
  return this
}

/**
 * Alias to set the "limit" value of the query
 * 
 * @return {Query} instance
 */
Query.prototype.take = function take(n) {
  this._limit = Number(n)
  return this
}

/**
 * Alias to set the "offset" value of the query
 * 
 * @return {Query} instance
 */
Query.prototype.skip = function skip(n) {
  this._skip = Number(n)
  return this
}

/**
 * Add an "order by" clauses to the query
 * 
 * @return {Query} instance
 */
Query.prototype.order = function order() {
  var args = _.toArray(arguments)
  
  this._order = _.uniq(this._order.concat(args))
  return this
}

/**
 * 
 * 
 * @return {Promise}
 */
Query.prototype.fetch = function fetch(cb) {
  return this.driver.fetch(this.assemble())
}

/**
 * 
 * 
 * @return {Promise}
 */
Query.prototype.fetchAll = function fetchAll(cb) {
  return this.driver.fetchAll(this.assemble())
}

/**
 * 
 * 
 * @return {Promise}
 */
Query.prototype.insert = function insert(data) {
  return this.driver.insert(data, this.assemble())
}

/**
 * 
 * 
 * @return {Promise}
 */
Query.prototype.update = function update(data) {
  return this.driver.update(data, this.assemble())
}

/**
 * 
 * 
 * @return {Promise}
 */
Query.prototype.destroy = function destroy(cb) {
  return this.driver.destroy(this.assemble())
}

/**
 * Get the object representation of the query.
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