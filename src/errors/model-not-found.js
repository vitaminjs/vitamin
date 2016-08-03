
import XError from 'es6-error'

/**
 * Model Not Found Error
 */
class Error extends XError {
  
  /**
   * Not Found Error constructor
   * 
   * @param {String} message
   * @constructor
   */
  constructor(message = "Model Not Found") {
    super(message)
  }
  
}

// exports
export default Error