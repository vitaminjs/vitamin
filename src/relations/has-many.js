
var _ = require('underscore'),
    Promise = require('bluebird'),
    Relation = require('has-one-or-many')

module.exports = Relation.extend({
  
  /**
   * Attach many models to the parent model
   * 
   * @param {Array} models
   * @param {Function} cb (optional)
   * @return Promise instance
   */
  saveMany: function saveMany(models, cb) {
    return Promise
      .bind(this)
      .map(models, function (model) {
        return this.save(model)
      })
  },
  
  /**
   * Load the related models from the database
   * 
   * @return Promise instance
   * @private
   */
  _load: function _load() {
    return this.query.fetchAll()
  },
  
  /**
   * Build model dictionary keyed by the given key
   * 
   * @param {Array} models
   * @param {String} key
   * @return object
   * @private
   */
  _buildDictionary: function _buildDictionary(models, key) {
    var dict = {}
    
    _.each(models, function (mdl) {
      var _key = String(mdl.get(key))
      
      if ( _.has(dict, _key) ) dict[_key] = []
      
      // transform numeric keys to string keys for good matching
      dict[_key].push(mdl)
    })
    
    return dict
  },
  
  /**
   * Get the default value for the relationship
   * 
   * @return any
   */
  _getRelatedDefaultValue: function _getRelatedDefaultValue() {
    return []
  }
  
})
