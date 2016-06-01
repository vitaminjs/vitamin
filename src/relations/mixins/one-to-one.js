
var _ = require('underscore')

module.exports = {
  
  /**
   * Load the related model from the database
   * 
   * @return Promise instance
   * @private
   */
  _load: function _load() {
    return this.query.fetch()
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
      // for good matching, transform numeric keys to string
      dict[String(mdl.get(key))] = mdl
    })
    
    return dict
  },
  
  /**
   * Get the default value for the relationship
   * 
   * @return null
   * @private
   */
  _getRelatedDefaultValue: function _getRelatedDefaultValue() {
    return null
  }
  
}