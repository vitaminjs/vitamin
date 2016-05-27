
var _ = require('underscore'),
    Promise = require('bluebird'),
    ModelNotFound = require('./errors').ModelNotFoundError

module.exports = Query

/**
 * Query Builder constructor
 * 
 * @param {Object} driver
 * @constructor
 */
function Query(driver) {
  this._select = []
  this._where  = []
  this._order  = []
  this._rels   = []
  this._skip   = undefined
  this._limit  = undefined
  this._from   = undefined
  
  // make `driver` property private
  Object.defineProperty(this, 'driver', { value: driver })
}

/**
 * Set the relationships that should be eager loaded
 * 
 * @param {Array|String} related
 * @return Query instance
 */
Query.prototype.with = function with(related) {
  this._rels = _.isArray(rels) ? rels : _.toArray(arguments)
  return this
}

/**
 * Load the relationships for the models
 * 
 * @param {Array<Model>} models
 * @return Promise instance
 */
Query.prototype.loadRelated = function loadRelated(models) {
  return Promise
    .bind(this)
    .map(this._rels, function iterateRelations(name) {
      var relation = this._getRelation(name)
      
      // a proposal for Relation.eagerLoad()
      return relation.eagerLoad(models, name)
    })
}

/**
 * Set the model being queried
 * 
 * @param {Model} model
 * @return Query instance
 */
Query.prototype.setModel = function setModel(model) {
  this.model = model
  return this
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
      op = _.isArray(val) ? "$in" : "$eq"
    
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
 * @param {Function} cb optional callback
 * @return {Promise}
 */
Query.prototype.fetch = function fetch(cb) {
  return Promise
    .bind(this)
    .then(function () {
      return this.driver.fetch(this.assemble())
    })
    .then(function (resp) {
      if ( _.isEmpty(resp) ) 
        return Promise.reject(new ModelNotFound)
      
      return this.model.setData(resp, true)
    })
    .nodeify(cb)
}

/**
 * Fetch many records from th database
 * 
 * @return {Promise}
 */
Query.prototype.fetchAll = function fetchAll(cb) {
  return Promise
    .bind(this)
    .then(function () {
      return this.driver.fetchAll(this.assemble())
    })
    .then(function (resp) {
      var Model = this.model.constructor
      
      return _.map(resp, Model.factory.bind(Model))
    })
    .nodeify(cb)
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
 * Get the relation instance for the given relation name
 * 
 * @param {String} name
 * @return Relation instance
 * @private
 */
Query.prototype._getRelation = function _getRelation(name) {
  var relation = this.model[name]
  
  if (! relation ) throw new Error("Undefined '" + name + "' relationship")
  
  return relation.apply(this.model)
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

