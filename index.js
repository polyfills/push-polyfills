
var Promise = require('native-or-bluebird')
var spdy = require('spdy-push')

module.exports = Polyfill

function Polyfill(polyfill, req, res, options) {
  this.polyfill = polyfill
  this.req = req
  this.res = res
  options = options || {}
  this.minify = options.minify || true
  this.cacheControl = options.cacheControl || 'public, max-age=604800'
}

Polyfill.prototype.push = function (cb) {
  var res = this.res
  if (!res.isSpdy) {
    if (cb) setImmediate(cb)
    return Promise.resolve()
  }

  var self = this
  var polyfill = this.polyfill
  var promise = polyfill(this.req.headers['user-agent']).then(function (data) {
    var headers = {
      'cache-control': self.cacheControl,
      'content-encoding': 'gzip',
      'content-type': 'application/javascript; charset=UTF-8',
      'etag': '"' + data.hash + '"',
      'vary': 'User-Agent',
    }

    var gzip = polyfill.select(data, self.minify, true)
    return spdy(res).push({
      path: '/polyfill.js',
      priority: 0,
      headers: headers,
      filename: polyfill.pathOf(data.name, gzip[0])
    })
  })

  if (cb) {
    promise.then(function () {
      cb()
    }, cb)
  }

  return promise
}

Polyfill.prototype.then = function () {
  return this.push()
}
