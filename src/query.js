
var _ = require('underscore'),
    Promise = require('bluebird'),
    ModelNotFound = require('./errors').ModelNotFoundError

module.exports = Query

/**
 * Query Builder constructor
 * 
 * @param {Object} builder
 * @constructor
 */
function Query(builder) {
  this._rels = {}
  this.builder = builder
}

/**
 * Set the relationships that should be eager loaded
 * Use case:
 *   with(
 *     'tags',
 *     { 'comments': ['author', 'likes'] },
 *     { 'editor': function (q) { q.select('fullname') } }
 *   )
 * 
 * @param {Array|String} related
 * @return Query instance
 */
Query.prototype.populate = function populate(related) {
  var rels = {}
  
  if (! _.isArray(related) ) related = _.toArray(arguments)
  
  _.each(related, function (value) {
    if ( _.isString(value) ) rels[value] = function noop(q) {}
    else if ( _.isObject(value) ) _.extend(rels, value)
  })
  
  _.extend(this._rels, rels)
  return this
}

/**
 * Load the relationships for the models
 * 
 * @param {Array} models
 * @return Promise instance
 */
Query.prototype.loadRelated = function loadRelated(models) {
  // no need to load related, if there is no parent model
  if ( _.isEmpty(models) ) return Promise.resolve() 
  
  return Promise.map(_.keys(this._rels), this._eagerLoad.bind(this, models))
}

/**
 * Set the model being queried
 * 
 * @param {Model} model
 * @return Query instance
 */
Query.prototype.setModel = function setModel(model) {
  this.builder.from(model.getTableName())
  this.model = model
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
      return this.builder.first()
    })
    .then(function (resp) {
      if ( _.isEmpty(resp) ) 
        return Promise.reject(new ModelNotFound)
      
      return this.model.setData(resp, true)
    })
    .tap(function (model) {
      return this.loadRelated([model])
    })
    .nodeify(cb)
}

/**
 * Fetch many records from th database
 * 
 * @param {Function} cb (optional)
 * @return {Promise}
 */
Query.prototype.fetchAll = function fetchAll(cb) {
  return Promise
    .bind(this)
    .then(function () {
      return this.builder.select()
    })
    .then(function (resp) {
      // map results to model objects
      return _.map(resp, function (data) {
        return this.newExistingInstance(data)
      }, this.model)
    })
    .tap(this.loadRelated)
    .nodeify(cb)
}

/**
 * Insert a new record into the database
 * 
 * @param {Object} data
 * @param {Function} cb (optional)
 * @return {Promise}
 */
Query.prototype.insert = function insert(data, cb) {
  var pk = this.model.getKeyName(), 
      query = this.builder.insert(data).returning(pk)
  
  return Promise.resolve(query).nodeify(cb)
}

/**
 * Update a record in the database
 * 
 * @param {Object} data
 * @param {Function} cb (optional)
 * @return {Promise}
 */
Query.prototype.update = function update(data, cb) {
  return Promise.resolve(this.builder.update(data)).nodeify(cb)
}

/**
 * Delete a record from the database
 * 
 * @param {Function} cb (optional)
 * @return {Promise}
 */
Query.prototype.destroy = function destroy(cb) {
  return Promise.resolve(this.builder.del()).nodeify(cb)
}

/**
 * Get the relation instance for the given relation name
 * 
 * @param {String} name
 * @return Relation instance
 * @private
 */
Query.prototype._getRelation = function _getRelation(name) {
  var relationFn = this.model[name]
  
  if (! relationFn ) throw new Error("Undefined '" + name + "' relationship")
  
  return this._initRelation(relationFn.call(this.model), this._rels[name])
}

/**
 * Eager load a relationship
 * 
 * @param {Array} models
 * @param {String} name
 * @return Promise instance
 * @private
 */
Query.prototype._eagerLoad = function _eagerLoad(models, name) {
  return this._getRelation(name).eagerLoad(name, models)
}

/**
 * Customize the relationship query
 * 
 * @param {Relation} relation
 * @param {Array|Function} custom
 * @return Relation instance
 * @private
 */
Query.prototype._initRelation = function _initRelation(relation, custom) {
  // set nested models
  if ( _.isArray(custom) ) relation.with(custom)
  
  // use custom constraints
  if ( _.isFunction(custom) ) custom.call(null, relation.query)
  
  return relation
}

// create proxies to the builder methods
var methods = [
  'select', 'distinct',
  'orderBy', 'offset', 'limit',
  'where', 'orWhere', 'whereRaw',
  'whereIn', 'orWhereIn',
  'whereNotIn', 'orWhereNotIn',
  'whereNull', 'orWhereNull', 
  'whereNotNull', 'orWhereNotNull',
  'whereExists', 'orWhereExists',
  'whereNotExists', 'orWhereNotExists',
  'whereBetween', 'orWhereBetween',
  'whereNotBetween', 'orWhereNotBetween',
  'join', 'innerJoin', 'leftJoin', 'rightJoin', 'outerJoin', 'crossJoin'
]

_.each(methods, function (name) {
  
  Query.prototype[name] = function () {
    (this.builder[name]).apply(this.builder, arguments)
    return this
  }
  
})
