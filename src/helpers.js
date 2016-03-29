
var _ = require('underscore')

module.exports.usePlugin = usePlugin

/**
 * Use a plugin
 * 
 * @param {Function|Object} plugin object with `install` method, or simply a function
 */
function usePlugin(plugin) {
  if ( plugin.installed === true ) return this
  
  var args = _.rest(arguments)
  
  // prepend Vitamin as first argument
  args.unshift(this)
  
  if ( _.isFunction(plugin.install) ) {
    plugin.install.apply(null, args)
  }
  else if ( _.isFunction(plugin) ) {
    plugin.apply(null, args)
  }
  
  // prevent reuse the same plugin next time
  plugin.installed = true
  
  return this
}
