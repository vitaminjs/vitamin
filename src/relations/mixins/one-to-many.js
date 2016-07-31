
import Promise from 'bluebird'

// exports
export default (parent) => class extends parent {
  
  /**
   * Get the result of the relationship
   * 
   * @return promise
   */
  load() {
    this.getQuery().fetch()
  }
  
  /**
   * Create many instances of the related model
   * 
   * @param {Array} records
   * @return promise
   */
  createMany(records) {
    return Promise.map(records, this.create)
  }
  
  /**
   * Attach many models to the parent model
   * 
   * @param {Array} models
   * @return promise
   */
  saveMany(models) {
    return Promise.map(models, this.save)
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
    return related.groupBy(key)
  }
  
}