
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
    return _.groupBy(models, function (mdl) {
      return String(mdl.get(key))
    })
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
