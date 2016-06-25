
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
  this.rels = {}
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
Query.prototype.populate = 
Query.prototype.withRelated = function withRelated(related) {
  var rels = {}
  
  if (! _.isArray(related) ) related = _.toArray(arguments)
  
  // parseWithRelated
  _.each(related, function (value) {
    if ( _.isString(value) ) rels[value] = function noop(q) {}
    else if ( _.isObject(value) ) _.extend(rels, value)
  })
  
  _.extend(this.rels, rels)
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
  if ( models && models.length === 0 ) return Promise.resolve() 
  
  return Promise.map(_.keys(this.rels), this.eagerLoad.bind(this, models))
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
 * Find a model by its primary key
 * 
 * @param {any} id
 * @param {Array} columns (optional)
 * @param {Function} cb (optional)
 * @return Promise instance
 */
Query.prototype.find = function find(id, columns, cb) {
  if ( _.isArray(id) ) return this.findMany.apply(this, arguments)
  
  if ( _.isFunction(columns) ) {
    cb = columns
    columns = []
  }
  
  this.where(this.model.getQualifiedKeyName(), id)
  
  return this.fetch(columns, cb)
}

/**
 * Find a model by its primary key or return fresh model instance
 * 
 * @param {any} id
 * @param {Array} columns (optional)
 * @param {Function} cb (optional)
 * @return Promise instance
 */
Query.prototype.findOrNew = function (id, columns, cb) {
  var model = this.model
  
  return this.find(id, columns).catch(function (error) {
    if ( error instanceof ModelNotFound )
      return Promise.resolve(model.newInstance())
    else
      return Promise.reject(error)
  }).nodeify(cb)
}

/**
 * Find multiple models by their primary keys
 * 
 * @param {Array} ids
 * @param {Array} columns (optional)
 * @param {Function} cb (optional)
 * @return Promise instance
 */
Query.prototype.findMany = function findMany(ids, columns, cb) {
  if ( _.empty(ids) ) 
    return Promise.resolve(this.model.newCollection()).nodeify(cb)
  
  if ( _.isFunction(columns) ) {
    cb = columns
    columns = []
  }
  
  this.whereIn(this.model.getQualifiedKeyName(), ids)
  
  return this.fetchAll(columns, cb)
}

/**
 * Fetch one record from the database
 * 
 * @param {Array} columns (optional)
 * @param {Function} cb optional callback
 * @return Promise instance
 */
Query.prototype.first =
Query.prototype.fetch = function fetch(columns, cb) {
  if ( _.isFunction(columns) ) {
    cb = columns
    columns = []
  }
  
  return Promise
    .bind(this)
    .then(function () {
      return this.builder.first(columns)
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
 * Get the first record matching the attributes or instantiate it
 * 
 * @param {Object} attrs
 * @param {Function} cb (optional)
 * @return Promise instance
 */
Query.prototype.firstOrNew = function firstOrNew(attrs, cb) {
  var model = this.model
  
  return this.where(attrs).first().catch(function (error) {
    if ( error instanceof ModelNotFound )
      return Promise.resolve(model.newInstance(attrs))
    else
      return Promise.reject(error)
  }).nodeify(cb)
}

/**
 * Get the first record matching the attributes or create it
 * 
 * @param {Object} attrs
 * @param {Function} cb (optional)
 * @return Promise instance
 */
Query.prototype.firstOrCreate = function firstOrCreate(attrs, cb) {
  var model = this.model
  
  return this.where(attrs).first().catch(function (error) {
    if ( error instanceof ModelNotFound )
      return model.newInstance(attrs).save()
    else
      return Promise.reject(error)
  }).nodeify(cb)
}

/**
 * Fetch many records from th database
 * 
 * @param {Array} columns (optional)
 * @param {Function} cb (optional)
 * @return {Promise}
 */
Query.prototype.all =
Query.prototype.fetchAll = function fetchAll(columns, cb) {
  if ( _.isFunction(columns) ) {
    cb = columns
    columns = []
  }
  
  return Promise
    .bind(this)
    .then(function () {
      return this.builder.select(columns)
    })
    .then(function (resp) {
      // map results to model objects
      var models = _.map(resp, function (data) {
        return this.newExistingInstance(data)
      }, this.model)
      
      return this.model.newCollection(models)
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
 * Get an array with the values of a given column
 * 
 * @param {String} column
 * @param {Function} cb (optional)
 * @return Promise instance
 */
Query.prototype.pluck = function pluck(column, cb) {
  return Promise.resolve(this.builder.pluck(column)).nodeify(cb)
}

/**
 * Get the `count` result of the query
 * 
 * @param {String} column (optional)
 * @param {Function} cb (optional)
 * @return Promise instance
 */
Query.prototype.count = function count(column, cb) {
  if ( _.isFunction(column) ) {
    cb = column
    column = null
  }
  
  if ( _.isEmpty(column) ) column = '*'
  
  return Promise
    .resolve(this.builder.count(column + ' as aggregate'))
    .then(function (result) {
      return _.first(result)['aggregate'] || 0
    })
    .nodeify(cb)
}

/**
 * Get the `sum` of the values of a given column
 * 
 * @param {String} column
 * @param {Function} cb (optional)
 * @return Promise instance
 */
Query.prototype.sum = function sum(column, cb) {
  return Promise
    .resolve(this.builder.sum(column + ' as aggregate'))
    .then(function (result) {
      return _.first(result)['aggregate'] || 0
    })
    .nodeify(cb)
}

/**
 * Get the minimum value of a given column
 * 
 * @param {String} column
 * @param {Function} cb (optional)
 * @return Promise instance
 */
Query.prototype.min = function min(column, cb) {
  return Promise
    .resolve(this.builder.min(column + ' as aggregate'))
    .then(function (result) {
      return _.first(result)['aggregate']
    })
    .nodeify(cb)
}

/**
 * Get the maximum value of a given column
 * 
 * @param {String} column
 * @param {Function} cb (optional)
 * @return Promise instance
 */
Query.prototype.max = function max(column, cb) {
  return Promise
    .resolve(this.builder.max(column + ' as aggregate'))
    .then(function (result) {
      return _.first(result)['aggregate']
    })
    .nodeify(cb)
}

/**
 * Get the average of the values of a given column
 * 
 * @param {String} column
 * @param {Function} cb (optional)
 * @return Promise instance
 */
Query.prototype.avg = 
Query.prototype.average = function average(column, cb) {
  return Promise
    .resolve(this.builder.avg(column + ' as aggregate'))
    .then(function (result) {
      return _.first(result)['aggregate']
    })
    .nodeify(cb)
}

/**
 * Get a single column's value from the first result of a query
 * 
 * @param {String} column
 * @param {Function} cb (optional)
 * @return Promise instance
 */
Query.prototype.value = function value(column, cb) {
  return Promise
    .resolve(this.builder.column(column).first())
    .then(function (result) { return (result)[column] })
    .nodeify(cb)
}

/**
 * Simple pagination of the given query
 * 
 * @param {Integer} page
 * @param {Integer} pageSize
 * @param {Array} columns (optional)
 * @parma {Function} cb (optional)
 * @return Promise instance
 */
Query.prototype.paginate = function paginate(page, pageSize, columns, cb) {
  this.offset((page - 1) * pageSize).limit(pageSize)
  
  return this.fetchAll(columns, cb)
}

/**
 * Get the relation instance for the given relation name
 * 
 * @param {String} name
 * @return Relation instance
 * @private
 */
Query.prototype.getRelation = function _getRelation(name) {
  var relationFn = this.model[name]
  
  if (! relationFn ) throw new Error("Undefined relationship: " + name)
  
  return this.initRelation(relationFn.call(this.model), this.rels[name])
}

/**
 * Eager load a relationship
 * 
 * @param {Array} models
 * @param {String} name
 * @return Promise instance
 * @private
 */
Query.prototype.eagerLoad = function _eagerLoad(models, name) {
  return this.getRelation(name).eagerLoad(name, models)
}

/**
 * Customize the relationship query
 * 
 * @param {Relation} relation
 * @param {Array|Function} custom
 * @return Relation instance
 * @private
 */
Query.prototype.initRelation = function _initRelation(relation, custom) {
  // set nested models
  if ( _.isArray(custom) ) relation.populate(custom)
  
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
