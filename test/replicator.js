var tap = require('tape')
var test = tap.test
var memdown = require('memdown')
var levelup = require('levelup')
var sublevel = require('level-sublevel')
var replicator = require('../replicator')
var PACKAGE = require('../package.json')

test('Initialization', function(t) {
  var db, rep, er

  try { rep = replicator() } catch (e) { er = e }
  t.ok(er, 'Exception for no db provided')

  er = null
  db = levelup('db', {db:memdown, keyEncoding:'binary'})
  try { rep = replicator(db) } catch (e) { er = e }
  t.ok(er, 'Exception for non-utf8 keyEncoding')

  er = null
  db = levelup('db', {db:memdown, valueEncoding:'binary'})
  try { rep = replicator(db) } catch (e) { er = e }
  t.ok(er, 'Exception for non-JSON valueEncoding')

  er = null
  db = sublevel(db)
  var someSub = db.sublevel('someSub')
  db = levelup('db', {db:memdown, keyEncoding:'utf8', valueEncoding:'json'})
  try { rep = replicator(someSub) } catch (e) { er = e }
  t.ok(er, 'Exception for replicator on a sublevel')

  er = null
  db = levelup('db', {db:memdown, keyEncoding:'utf8', valueEncoding:'json'})
  try { rep = replicator(db) } catch (e) { er = e }
  t.same(er && er.message, null, 'No error for keyEncoding:utf8 and valueEncoding:binary')
  t.ok(rep, 'Replicating db was returned')

  t.end()
})

test('Hooks batching', function(t) {
  var db = levelup('db', {db:memdown, valueEncoding:'json'})
  var old = db
  db = replicator(db, on_init)

  function on_init(er) {
    t.ok(!er, 'No problem initializing')
    t.ok(db, 'Returned a replicating db')
    t.ok(db.replicator, 'Replicating db has a reference to its replicator subDB')

    t.equal(db.replicator.version, PACKAGE.version, 'Replicator set its version')
    db.replicator.get('version', function(er, ver) {
      if(er) throw er
      t.equal(ver, PACKAGE.version, 'Replicator version was stored')
      init_data()
    })
  }

  function init_data() {
    db.put('jason', 10, function(er) {
      t.ok(!er, 'No problem putting value: jason')

    db.put('issaree', 10, function(er) {
      t.ok(!er, 'No problem putting value: issaree')

    db.batch([ {type:'put', key:'jason', value:5}
             , {type:'put', key:'issaree', value:15}
             ] , function (er) {
      t.ok(!er, 'No problem running a batch')
      dir(old)

    t.end() }) }) })
  }
})

function dir(db) {
  console.log('')
  db.createReadStream({end:null})
  .on('data', function(data) {
    var key = data.key.replace(/\xff/g, '/')
    console.log('%s = %j', key, data.value)
  })
}
