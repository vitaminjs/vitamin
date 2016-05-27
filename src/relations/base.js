
var _ = require('underscore')

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
  var Super = this
  
  // constructor
  function Ctor(parent, query) { Super.apply(this, arguments) }
  
  // inheritance
  Ctor.prototype = Object.create(Super.prototype)
  _.assign(Ctor.prototype, { constructor: Ctor }, props)
  
  return Ctor
}

/**
 * Get the results of the relationship
 * 
 * @param {Function} cb optional callback
 * @return a promise
 */
Relation.prototype.load = function load(cb) {
  this.applyConstraints([this.parent])
  return this._load(cb)
}

/**
 * populate the results of the relationship
 * 
 * @param {Array<Model>} models
 * @param {String} name
 * @return Promise instance
 */
Relation.prototype.eagerLoad = function(models, name) {
  this.applyConstraints(models)
  return this._load().then(function (results) {
    this._populate(results, models, name)
  })
}

/**
 * Apply constraints on the relation query
 * 
 * @param {Array} models
 */
Relation.prototype.applyConstraints = function applyConstraints(models) {
  throw new Error("`Relation.applyConstraints()` should be overridden")
}

/**
 * Get the primary keys of all the given models
 * 
 * @param {Array} models
 * @param {String} key primary key name
 * @return {Array} ids
 */
Relation.prototype.getKeys = function getKeys(models, key) {
  var ids = _.chain(models).map(function (model) {
    return key ? model.get(key) : model.getId()
  }).uniq().value()
  
  return ids.length === 1 ? ids[0] : ids
}

/**
 * Load the data from the database
 * 
 * @param {Function} cb (optional)
 * @return a promise
 * @private
 */
Relation.prototype._load = function _load(cb) {
  throw new Error("`Relation._load()` should be overridden")
}

/**
 * Populate the parent models with the eagerly loaded results
 * 
 * @param {Array<Model>} results
 * @param {Array<Model>} models
 * @param {String} name
 * @private
 */
Relation.prototype._populate = function _populate(results, models, name) {
  throw new Error("`Relation._populate()` should be overridden")
}
