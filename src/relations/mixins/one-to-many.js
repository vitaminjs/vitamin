
var _ = require('underscore')

module.exports = {
  
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
      
      if (! _.has(dict, _key) ) dict[_key] = []
      
      // transform numeric keys to string keys for good matching
      dict[_key].push(mdl)
    })
    
    return dict
  },
  
  /**
   * Get the default value for the relationship
   * 
   * @return Array
   * @private
   */
  _getRelatedDefaultValue: function _getRelatedDefaultValue() {
    return []
  }
  
}