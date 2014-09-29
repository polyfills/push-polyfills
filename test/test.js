
var spdy = require('spdy')
var http = require('http')
var https = require('https')
var assert = require('assert')
var polyfill = require('polyfills')()

var Polyfill = require('..')

var PORT = 51231

polyfill.clean()

it('should push the polyfill', function (done) {
  spdy.createServer(require('spdy-keys'), function (req, res) {
    new Polyfill(polyfill, req, res).then(function () {
      res.statusCode = 204
      res.end()
    })
  }).listen(PORT)

  var agent = spdy.createAgent({
    port: PORT,
    rejectUnauthorized: false
  })

  https.get({
    host: 'localhost',
    agent: agent
  }, function (res) {
    assert.equal(res.statusCode, 204)
  })

  agent.on('push', function (stream) {
    assert.equal(stream.url, '/polyfill.js')
    assert.equal(stream.headers['content-encoding'], 'gzip')
    assert.equal(stream.headers['content-type'], 'application/javascript; charset=UTF-8')
    assert.equal(stream.headers['vary'], 'User-Agent')
    assert(stream.headers['cache-control'])
    assert(stream.headers['etag'])
    done()
  })
})

it('should support callbacks', function (done) {
  PORT++

  spdy.createServer(require('spdy-keys'), function (req, res) {
    new Polyfill(polyfill, req, res).push(function (err) {
      assert.ifError(err)
      res.statusCode = 204
      res.end()
    })
  }).listen(PORT)

  var agent = spdy.createAgent({
    port: PORT,
    rejectUnauthorized: false
  })

  https.get({
    host: 'localhost',
    agent: agent
  }, function (res) {
    assert.equal(res.statusCode, 204)
  })

  agent.on('push', function (stream) {
    assert.equal(stream.url, '/polyfill.js')
    assert.equal(stream.headers['content-encoding'], 'gzip')
    assert.equal(stream.headers['content-type'], 'application/javascript; charset=UTF-8')
    assert.equal(stream.headers['vary'], 'User-Agent')
    assert(stream.headers['cache-control'])
    assert(stream.headers['etag'])
    done()
  })
})

it('should not throw when not spdy', function (done) {
  PORT++

  http.createServer(function (req, res) {
    new Polyfill(polyfill, req, res).push(function (err) {
      assert.ifError(err)
      res.statusCode = 204
      res.end()
    })
  }).listen(PORT)

  http.get({
    host: 'localhost',
    port: PORT,
  }, function (res) {
    assert.equal(res.statusCode, 204)
    done()
  })
})
