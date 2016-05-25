
var _ = require('underscore')

module.exports = BaseRelation

/**
 * @constructor
 */
function BaseRelation(parent, query) {
  this.parent = parent
  this.query = query
}

/**
 * Create and return a child relation
 * 
 * @param {Object} props
 * @return {Function}
 * @static
 */
BaseRelation.extend = function extend(props) {
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
 * @return {Promise}
 */
BaseRelation.prototype.load = function load(cb) {
  throw new Error("`Relation.load()` should be overridden")
}

/**
 * Apply constraints on the relation query
 * 
 * @param {Array} models
 */
BaseRelation.prototype.applyConstraints = function applyConstraints(models) {
  throw new Error("`Relation.applyConstraints()` should be overridden")
}

/**
 * Get the primary keys of a ll the given models
 * 
 * @param {Array} models
 * @param {String} key primary key name
 * @return {Array} ids
 */
BaseRelation.prototype.getKeys = function getKeys(models, key) {
  return _.chain(models).map(function (model) {
    return key ? model.get(key) : model.getId()
  }).uniq().value()
}
