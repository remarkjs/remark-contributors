const mdast  = require('mdast')
const test   = require('tape')
const diff   = require('diff')
const plugin = require('./')
const fs     = require('fs')

const fixtures = {
  'Adds section if none exists': fs.readFileSync('fixtures/basic.md', 'utf8'),
  'Replaces table if present in section': fs.readFileSync('fixtures/replace-table.md', 'utf8'),
  'Adds table if not present in section': fs.readFileSync('fixtures/add-table.md', 'utf8')
}

const expected = {
  'Adds section if none exists': fs.readFileSync('fixtures/basic-expected.md', 'utf8'),
  'Replaces table if present in section': fs.readFileSync('fixtures/replace-table-expected.md', 'utf8'),
  'Adds table if not present in section': fs.readFileSync('fixtures/add-table-expected.md', 'utf8')
}

test('mdast-contributors', function(t) {
  const processor = mdast.use(plugin, {
    contributors: [
      { name: 'Hugh Kennedy', github: 'hughsk', twitter: 'hughskennedy' },
      { name: 'Tim Oxley', github: 'timoxley', twitter: 'secoif' },
      { name: 'Rod Vagg', github: 'rvagg', twitter: '@rvagg' }
    ]
  })

  Object.keys(fixtures).forEach(function(name) {
    const actual = processor.process(fixtures[name]).trim()
    const expect = expected[name].trim()

    t.equal(actual, expect, name)

    if (actual !== expect) {
      console.error(diff.diffChars(expect, actual))
    }
  })

  t.end()
})
