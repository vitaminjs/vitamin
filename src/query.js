
var Promise = require('bluebird')
var _ = require('underscore')

module.exports = Query

/**
 * Vitamin query builder constructor
 * 
 * @param {Object} driver
 * @constructor
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
 *   where('status', "$ne", "draft")
 *   where({ name: "Rita", age: 18 })
 *   where('price', { $gt: 100, $lte: 200 })
 * 
 * @param {String|Object} key
 * @param {String} op
 * @param {any} value
 * @return {Query} instance
 */
Query.prototype.where = function where(key, op, val) {
  var cond = {}
  
  switch (arguments.length) {
    case 2:
      val = op
      op = "$eq"
    
    case 3:
      cond = _object(key, _object(op, val))
    
    case 1:
      // TODO check for closures and query instances
      cond = key
  }
  
  if (! _.isEmpty(cond) ) this._where.push(cond)
  
  return this
}

/**
 * Add an "or where" clause to the query
 * Example: orWhere({name: "foo"}, {name: "bar"})
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
 * Fetch one record from the database
 * 
 * @return {Promise}
 */
Query.prototype.fetch = function fetch(cb) {
  return this.driver.fetch(this.assemble())
}

/**
 * Fetch all records from th database
 * 
 * @return {Promise}
 */
Query.prototype.fetchAll = function fetchAll(cb) {
  return this.driver.fetchAll(this.assemble())
}

/**
 * Insert a new record into the database
 * 
 * @return {Promise}
 */
Query.prototype.insert = function insert(data) {
  return this.driver.insert(data, this.assemble())
}

/**
 * Update a record in the database
 * 
 * @return {Promise}
 */
Query.prototype.update = function update(data) {
  return this.driver.update(data, this.assemble())
}

/**
 * Delete a record from the database
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

/**
 * Helper to create an plain object with one `key` and `value`
 * 
 * @param {String} key
 * @param {any} val
 * @return {Obejct}
 */
function _object(key, val) {
  if ( _.isObject(val) ) return val
  
  var o = {}
  o[key] = val
  return o
}

