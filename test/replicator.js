var tap = require('tape')
var test = tap.test
var memdown = require('memdown')
var levelup = require('levelup')
var sublevel = require('level-sublevel')
var replicator = require('../replicator')

test('Initialization', function(t) {
  var db, rep, er

  db = levelup('db', {db:memdown, keyEncoding:'binary'})
  try { rep = replicator(db) } catch (e) { er = e }
  t.ok(er, 'Exception for non-utf8 keyEncoding')

  er = null
  db = levelup('db', {db:memdown, valueEncoding:'binary'})
  try { rep = replicator(db) } catch (e) { er = e }
  t.ok(er, 'Exception for non-JSON valueEncoding')

  er = null
  db = levelup('db', {db:memdown, keyEncoding:'utf8', valueEncoding:'json'})
  try { rep = replicator(db) } catch (e) { er = e }
  t.same(er, null, 'No error for keyEncoding:utf8 and valueEncoding:binary')

  t.ok(rep, 'Replicator db was returned')

  er = null
  db = sublevel(db)
  var someSub = db.sublevel('someSub')
  db = levelup('db', {db:memdown, keyEncoding:'utf8', valueEncoding:'json'})
  try { rep = replicator(someSub) } catch (e) { er = e }
  t.ok(er, 'Exception for replicator on a sublevel')

  t.end()
})
