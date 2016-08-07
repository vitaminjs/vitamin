
// exports
export default (parent) => class extends parent {
  
  /**
   * Get the result of the relationship
   * 
   * @return promise
   */
  load() {
    this.getQuery().first()
  }
  
  /**
   * Build model dictionary keyed by the given key
   * 
   * @param {Collection} related
   * @param {String} key
   * @return plain object
   * @private
   */
  buildDictionary(related, key) {
    return related.keyBy(key)
  }
  
  /**
   * Parse the value for the relationship
   * 
   * @param {Model} value
   * @return any
   * @private
   */
  parseRelationValue(value) {
    return value || null
  }
  
}