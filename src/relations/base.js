
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

_.assign(Relation.prototype, {
  
  /**
   * Get the results of the relationship
   * 
   * @param {Function} cb (optional)
   * @return Promise instance
   */
  load: function load(cb) {
    this._applyConstraints([this.parent])
    return this._load().nodeify(cb)
  },
  
  /**
   * populate the results of the relationship
   * 
   * @param {String} name
   * @param {Array} models
   * @return Promise instance
   */
  eagerLoad: function(name, models) {
    this._applyConstraints(models)
    return this._load().then(this._populate.bind(this, name, models))
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
    var ids = _.chain(models).map(function (model) {
      return key ? model.get(key) : model.getId()
    }).uniq().value()
    
    return ids.length === 1 ? ids[0] : ids
  },
  
  /**
   * Apply constraints on the relation query
   * 
   * @param {Array} models
   * @private
   */
  _applyConstraints: function _applyConstraints(models) {
    throw new Error("`Relation._applyConstraints()` should be overridden")
  },
  
  /**
   * Load the data from the database
   * 
   * @return Promise instance
   * @private
   */
  _load: function _load() {
    throw new Error("`Relation._load()` should be overridden")
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
    throw new Error("`Relation._populate()` should be overridden")
  }
  
})