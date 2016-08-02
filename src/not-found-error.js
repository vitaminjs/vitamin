
import Error from 'es6-error'

/**
 * Model Not Found Error
 */
class ModelNotFoundError extends Error {
  
  /**
   * Not Found Error constructor
   * 
   * @param {String} message
   * @constructor
   */
  constructor(message = "Not Found") {
    super(message)
  }
  
}

// exports
export default ModelNotFoundError