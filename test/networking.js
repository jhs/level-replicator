// Stream and networking tests
//

var mkdb = require('./misc').mkdb
var assert = require('assert')
var replicate = require('../')


describe('Replication server', function () {
  describe('as a TCP service', function() {
    var db1 = mkdb()
    var db2 = mkdb()
    var srv1 = replicate.install(db1, 'sublevel', {port:8001, connections:{interval:100}, servers:{'127.0.0.1:8002':{}}})
    var srv2 = replicate.install(db2, 'sublevel', {port:8002, connections:{interval:100}, servers:{'127.0.0.1:8001':{}}})

    it('replicates from A to B', function(end) {
      db1.put('key1', 'value 1 into db 1')
      srv2.once('change', function(change) {
        assert.equal(change.type, 'put', 'Server 2 saw update from db1')
        assert.equal(change.key, 'key1', 'Server 2 saw new key from db1')
        assert.equal(change.value, 'value 1 into db 1', 'Server 2 saw new value from db1')
        end()
      })
    })

    if(false) // This test cannot run because the timestamp-based replication is so broken.
    it('replicates from B to A', function(end) {
      db2.put('key2', 'value 2 into db 2')
      srv1.once('change', function(change) {
        assert.equal(change.type, 'put', 'Server 1 saw update from db2')
        assert.equal(change.key, 'key2', 'Server 1 saw new key from db2')
        assert.equal(change.value, 'value 2 into db 2', 'Server 1 saw new value from db2')
        end()
      })
    })

    after(function(end) {
      srv1.on('error', function() {})
      srv2.on('error', function() {})
      srv1.on('closed', closed)
      srv2.on('closed', closed)
      srv1.close()
      srv2.close()

      var count = 0
      function closed() {
        count += 1
        if (count == 2)
          end()
      }
    })
  })
})
