
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
    this.query.where(this.otherKey, "$in", this._getKeys(models, this.localKey))
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
    var local = this.localKey, other = this.otherKey,
        dictionary = this._buildDictionary(results, other)
    
    for ( var owner in models ) {
      var key = String(owner.get(local))
      
      owner.rel(name, dictionary[key] || this._getRelatedDefaultValue())
    }
  }
  
})