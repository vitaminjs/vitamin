
var _ = require('underscore'),
    Query = require('../query'),
    utils = require('../utils'),
    Collection = require('../collection')

module.exports = Relation

/**
 * @param {Model} parent relationship owner
 * @param {Model} related
 * @constructor
 */
function Relation(parent, related) {
  this.parent = parent
  this.related = related
  this.query = related.newQuery()
}

/**
 * Create and return a child relation
 * 
 * @param {Object} props
 * @return {Function}
 * @static
 */
Relation.extend = function extend(props) {
  return utils.extend(this, props)
}

_.assign(Relation.prototype, {
  
  /**
   * Get the results of the relationship
   * 
   * @param {Function} cb (optional)
   * @return Promise instance
   */
  load: function load(cb) {
    this.applyConstraints()
    return this.get().nodeify(cb)
  },
  
  /**
   * populate the results of the relationship
   * 
   * @param {String} name
   * @param {Array} models
   * @return Promise instance
   */
  eagerLoad: function eagerLoad(name, models) {
    this.applyEagerConstraints(models)
    return this.get(true).then(this.hydrate.bind(this, name, models))
  },
  
  /**
   * Get the keys of the given models
   * 
   * @param {Array} models
   * @param {String} key
   * @return {Array} keys
   * @private
   */
  getKeys: function _getKeys(models, key) {
    if ( models instanceof Collection ) models = models.toArray()
    
    return _.chain(models).map(function (model) {
      return key ? model.get(key) : model.getId()
    }).uniq().value()
  },
  
  /**
   * Apply constraints on the relation query
   * 
   * @private
   */
  applyConstraints: function _applyConstraints() {
    this.query.where(this.otherKey, this.parent.get(this.localKey))
  },
  
  /**
   * Apply eager constraints on the relation query
   * 
   * @param {Array} models
   * @private
   */
  applyEagerConstraints: function _applyEagerConstraints(models) {
    this.query.whereIn(this.otherKey, this.getKeys(models, this.localKey))
  },

  /**
   * Hydrate the parent models with the eagerly loaded results
   * 
   * @param {String} name
   * @param {Array} models
   * @param {Array} results
   * @private
   */
  hydrate: function _hydrate(name, models, results) {
    var local = this.localKey, other = this.otherKey,
        dictionary = this.buildDictionary(results, other)
    
    models.forEach(function (owner) {
      var value = dictionary[owner.get(local)]
      
      owner.related(name, this.getRelationshipValue(value))
    }, this)
  }
  
})

// create proxies to query builder methods
var methods = [
  'where', 'orWhere', 'whereRaw',
  'whereIn', 'orWhereIn',
  'whereNotIn', 'orWhereNotIn',
  'whereNull', 'orWhereNull',
  'whereNotNull', 'orWhereNotNull',
  'whereExists', 'orWhereExists',
  'whereNotExists', 'orWhereNotExists',
  'whereBetween', 'orWhereBetween',
  'whereNotBetween', 'orWhereNotBetween',
  'populate', 'select', 'withRelated',
  'limit', 'offset', 'orderBy',
  'all', 'find', 'findMany', 'findOrNew',
  'first', 'firstOrNew', 'firstOrCreate'
]

_.each(methods, function (name) {
  
  Relation.prototype[name] = function () {
    (this.query[name]).apply(this.query, arguments)
    return this
  }
  
})
