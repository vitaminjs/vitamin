
var _ = require('underscore'),
    Query = require('../query'),
    utils = require('../utils')

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
    this._applyConstraints()
    return this._load().nodeify(cb)
  },
  
  /**
   * populate the results of the relationship
   * 
   * @param {String} name
   * @param {Array} models
   * @return Promise instance
   */
  eagerLoad: function eagerLoad(name, models) {
    this._applyEagerConstraints(models)
    
    return this.query
      .fetchAll()
      .then(this._populate.bind(this, name, models))
  },
  
  /**
   * Get the primary keys of all the given models
   * 
   * @param {Array} models
   * @param {String} key primary key name
   * @return {Array} ids
   * @private
   */
  _getKeys: function _getKeys(models, key) {
    return _.chain(models).map(function (model) {
      return key ? model.get(key) : model.getId()
    }).uniq().value()
  },
  
  /**
   * Apply constraints on the relation query
   * 
   * @private
   */
  _applyConstraints: function _applyConstraints() {
    this.query.where(this.otherKey, this.parent.get(this.localKey))
  },
  
  /**
   * Apply eager constraints on the relation query
   * 
   * @param {Array} models
   * @private
   */
  _applyEagerConstraints: function _applyEagerConstraints(models) {
    this.query.whereIn(this.otherKey, this._getKeys(models, this.localKey))
  },

  /**
   * Populate the parent models with the eagerly loaded results
   * 
   * @param {String} name
   * @param {Array} models
   * @param {Array} results
   * @private
   */
  _populate: function _populate(name, models, results) {
    var local = this.localKey, other = this.otherKey,
        dictionary = this._buildDictionary(results, other)
    
    _.each(models, function (owner) {
      var key = String(owner.get(local))
      
      owner.related(name, this._getRelationshipValue(dictionary[key]))
    }, this)
  }
  
})

// create proxies to query methods
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
  'populate', 'select',
  'limit', 'offset', 'orderBy'
]

_.each(methods, function (name) {
  
  Query.prototype[name] = function () {
    (this.query[name]).apply(this.query, arguments)
    return this
  }
  
})
