
import BaseModel from 'vitamin-model'
import _ from 'underscore'

/**
 * Vitamin Model Class
 */
class Model extends BaseModel {
  
  /**
   * Model constructor
   * 
   * @param {Object} data
   * @param {Boolean} exists
   * @constructor
   */
  constructor(data, exists = false) {
    super(data)
    
    this.exists = exists
  }
  
  
  
}

// exports
export default Model