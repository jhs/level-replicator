// A Git-inspired LevelDB replicator database (sublevel)
//

module.exports = replicator

var hooks = require('level-hooks')
var sublevel = require('level-sublevel')
var SubDB = require('level-sublevel/sub.js')
var stringRange = require('string-range')

var VERSION = require('./package.json').version

function replicator(db, callback) {
  if (!db || !db.options || db.options.keyEncoding != 'utf8')
    throw new Error('Only utf8 key encoding is supported')
  if (!db || !db.options || db.options.valueEncoding != 'json')
    throw new Error('Only json value encoding is supported')
  if (db instanceof SubDB)
    throw new Error('Replicator must be installed on a top-level database') // TODO: Is this necessary?

  if (db.replicator)
    return db

  db = sublevel(db)
  db.replicator = db.sublevel('_replicator', {valueEncoding:'json'})

  db.replicator.version = VERSION
  db.replicator.put('version', VERSION, function(er) {
    db.replicator.emit('log', 'Initialized with error=%j', !!er)
    if (callback)
      callback(er)
  })

  var not_my_key = anti_checker(db.replicator)
  db.hooks.pre(not_my_key, function(change, add, batch) {
    log_change(db, change, add, batch)
  })

  db.replicator.on('log', console.log)
  return db
}

function log_change(db, change, add, batch) {
  console.log('pre-change', change)
  var replicator = db.replicator

  var last = batch[batch.length - 1]
  if (last._replicator)
    return replicator.emit('log', 'Change log already added: %j', last)

  batch = JSON.parse(JSON.stringify(batch))
  var log = {type:'put', key:1, _replicator:true, value:JSON.parse(JSON.stringify(batch))}
  console.log('add to changes: %j', log)
  //add(log, changes)
}

// Return a checker for all keys NOT within this sublevel.
function anti_checker(db) {
  var min = db.prefix()
  var max = min + db._options.sep

  var checker = stringRange.checker({'min':min, 'max':max})
  function no_checker(key) {
    return ! checker(key)
  }

  return no_checker
}
