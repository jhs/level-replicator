// A Git-inspired LevelDB replicator database (sublevel)
//

module.exports = replicator

var hooks = require('level-hooks')
var sublevel = require('level-sublevel')
var SubDB = require('level-sublevel/sub.js')

function replicator(db) {
  if (!db || !db.options || db.options.keyEncoding != 'utf8')
    throw new Error('Only utf8 key encoding is supported')
  if (!db || !db.options || db.options.valueEncoding != 'json')
    throw new Error('Only json value encoding is supported')
  if (db instanceof SubDB)
    throw new Error('Replicator must be installed on a top-level database') // TODO: Is this necessary?

  db = sublevel(db)
  var replicator = db.sublevel('_replicator', {keyEncoding:'json'})

  return replicator
}
