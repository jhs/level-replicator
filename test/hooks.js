var tap = require('tape')
var test = tap.test
var hooks = require('level-hooks')
var memdown = require('memdown')
var levelup = require('levelup')

test('Hooks batching', function(t) {
  var db = levelup('db', {db:memdown})
  t.ok(db, 'Make a memdown db')

  hooks(db)
  db.hooks.pre(function(change, add) {
    console.log('change:', change)
  })

  db.put('hello', 'world', function(er) {
    t.ok(!er, 'Set: hello')
  })

  t.end()
})
