var mkdb = require('./misc').mkdb
var assert = require('assert')
var replicate = require('../')


describe('Replicator sublevel', function () {
  var db = mkdb('db')
  var srv, changes_db
  after(function() { if (srv) srv.close() })

  describe('database', function() {
    it('allows a "sublevel" parameter', function(end) {
      srv = replicate.install(db, 'sublevel', {port:8000, servers:{}})
      srv.on('ready', function(db) {
        changes_db = db
        end()
      })
    })

    it('logs .put() to a sublevel', function(end) {
      db.put('find me', 'in the sublevel', function (er) {
        if (er) throw er
        db_rows(changes_db, function(er, rows) {
          assert.equal(rows.length, 1, 'First log in the changes sub_db')

          var change = rows[0].value
          assert.equal(change.type, 'put', '"put" change logged')
          assert.equal(change.key, 'find me', 'change key logged')
          end()
        })
      })
    })

    it('logs .del() to a sublevel', function(end) {
      db.del('delete me', function (er) {
        if (er) throw er
        db_rows(changes_db, function(er, rows) {
          assert.equal(rows.length, 2, 'Second log in the changes sub_db')

          var change = rows[1].value
          assert.equal(change.type, 'del', '"del" change logged')
          assert.equal(change.key, 'delete me', 'deleted key logged')
          end()
        })
      })
    })

    it('logs .batch() to a sublevel', function(end) {
      db.batch([{type:'put', key:'batch-put', value:'putt'}, {type:'del', key:'batch-del'}], function(er) {
        if (er) throw er
        db_rows(changes_db, function(er, rows) {
          assert.equal(rows.length, 4, 'Third and fourth log from batch in the changes sub_db')

          // Technically it doesn't matter which order the changes are in.
          var change = rows[2].value
          assert.equal(change.type, 'put', 'batch put change logged')
          assert.equal(change.key, 'batch-put', 'batch put key logged')
          change = rows[3].value
          assert.equal(change.type, 'del', 'batch del change logged')
          assert.equal(change.key, 'batch-del', 'batch delete logged')
          end()
        })
      })
    })
  })

  describe('server', function() {
    it('emits a "change" event for put()', function(end) {
      db.put('my hope', 'replicator is a sublevel now')
      srv.once('change', function(change) {
        assert.equal(change.type , 'put')
        assert.equal(change.key  , 'my hope')
        assert.equal(change.value, 'replicator is a sublevel now')
        end()
      })
    })

    it('emits a "change" event for del()', function(end) {
      db.del('dashed hope')
      srv.once('change', function(change) {
        assert.equal(change.type , 'del')
        assert.equal(change.key  , 'dashed hope')
        end()
      })
    })

    it('emits a "change" event for batch()', function(end) {
      var hits = 0

      db.batch([{type:'put', key:'put-batch', value:1}, {type:'del', key:'del-batch'}])
      srv.on('change', check_batch)

      function check_batch(change) {
        if (change.type === 'put' && change.key === 'put-batch' && change.value === 1)
          hits += 1
        if (change.type === 'del' && change.key === 'del-batch')
          hits += 1

        if (hits == 2) {
          srv.removeListener('change', check_batch)
          end()
        }
      }
    })

    it('replicates just like normal', function(end) {
      var server2 = replicate.server(mkdb(), mkdb(), {listen:'skip', servers:{'127.0.0.1:8000':{}}})
      server2.on('change', check_change)
      db.put('lastest', 'the most recent change')

      function check_change(change) {
        if (change.type === 'put' && change.key === 'lastest' && change.value === 'the most recent change') {
          server2.emit('close')
          end()
        }
      }
    })
  })
})


function db_rows(db, callback) {
  var rows = []
  db.createReadStream().on('data', function(D) { rows.push(D) })
                       .on('end', function() { callback(null, rows) })
}
