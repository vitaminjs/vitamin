
/**
 * Model Not Found Error
 */
class NotFoundError extends Error {
  
  /**
   * @param {String} message
   * @constructor
   */
  constructor(message = "Not Found") {
    super(message)
    Error.captureStackTrace(this, NotFoundError)
  }
  
}

// exports
export default NotFoundError