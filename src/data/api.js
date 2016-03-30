
var DataContainer = require('./container')

module.exports = dataAPI

function dataAPI(Model) {
  
  /**
   * Define a universe id getter
   */
  Object.defineProperty(Model.prototype, '$id', { 
    get: function getId() { return this.get(this.$options.pk) }
  })
  
  /**
   * Set model attributes
   */
  Model.prototype.set = function set(key, val) {
    this.$data.set(key, val)
    return this
  }

  /**
   * Get the value of an attribute.
   * 
   * @param {String} attr name
   */
  Model.prototype.get = function get(attr) {
    return this.$data.get(attr)
  }

  /**
   * @param {String} attr name
   */
  Model.prototype.has = function has(attr) {
    return this.$data.has(attr)
  }

  /**
   * 
   */
  Model.prototype.isNew = function isNew() {
    return !this.has(this.$options.pk)
  }

  /**
   * 
   */
  Model.prototype.toJSON = function toJSON() {
    return this.$data.toJSON()
  }

  /**
   * @param {String} attr name
   */
  Model.prototype.isDirty = function isDirty(attr) {
    return this.$data.isDirty(attr)
  }
  
  /**
   * Normalize schema object and set default attributes
   * 
   * @private
   */
  Model.prototype._initData = function _initData(data) {
    // define model's data object
    Object.defineProperty(this, '$data', {
      value: new DataContainer(this, data || {})
    })
  }
  
}