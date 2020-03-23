'use strict'

var fs = require('fs')
var test = require('tape')
var remark = require('remark')
var vfile = require('to-vfile')
var contributors = require('.')

// Hide our project’s `package.json`.
try {
  fs.renameSync('package.json', 'package.json.bak')
} catch (_) {}

test.onFinish(ondone)

function ondone() {
  try {
    fs.renameSync('package.json.bak', 'package.json')
  } catch (_) {}
}

test('remark-contributors', function (t) {
  t.plan(14)

  remark()
    .use(contributors)
    .process(vfile.readSync('fixtures/no-heading/index.md'), function (
      err,
      file
    ) {
      t.deepEqual(
        [err, String(file)],
        [null, String(vfile.readSync('fixtures/no-heading/expected.md'))],
        'should not add a section by default'
      )
    })

  remark()
    .use(contributors, {appendIfMissing: true})
    .process(vfile.readSync('fixtures/no-heading/index.md'), function (
      err,
      file
    ) {
      t.deepEqual(
        [err, String(file)],
        [
          null,
          String(vfile.readSync('fixtures/no-heading/expected-if-append.md'))
        ],
        'should add a section if none exists and `appendIfMissing: true`'
      )
    })

  remark()
    .use(contributors)
    .process(vfile.readSync('fixtures/existing/index.md'), function (
      err,
      file
    ) {
      t.deepEqual(
        [err, String(file)],
        [null, String(vfile.readSync('fixtures/existing/expected.md'))],
        'should replace an existing table'
      )
    })

  remark()
    .use(contributors)
    .process(vfile.readSync('fixtures/other-table/index.md'), function (
      err,
      file
    ) {
      t.deepEqual(
        [err, String(file)],
        [null, String(vfile.readSync('fixtures/other-table/expected.md'))],
        'should not replace other tables'
      )
    })

  remark()
    .use(contributors, {
      formatters: {
        name: null,
        age: 'Age',
        commits: 'Commits',
        youtube: 'YouTube',
        term: 'Term'
      },
      contributors: [
        {
          name: 'Jason',
          age: 20,
          commits: 99,
          youtube: 'https://youtube.com/some-channel',
          term: 1
        },
        {commits: 20, name: 'Alex', term: 2},
        {name: 'Theo', commits: 19, age: 17}
      ]
    })
    .process(vfile.readSync('fixtures/heading/index.md'), function (err, file) {
      t.deepEqual(
        [err, String(file)],
        [
          null,
          String(vfile.readSync('fixtures/heading/expected-if-custom.md'))
        ],
        'should support custom fields'
      )
    })

  remark()
    .use(contributors, {
      contributors: [
        {name: 'Sara', github: 'sara'},
        {name: 'Jason'},
        {name: 'Alice', twitter: 'alice'}
      ]
    })
    .process(vfile.readSync('fixtures/heading/index.md'), function (err, file) {
      t.deepEqual(
        [err, String(file)],
        [
          null,
          String(
            vfile.readSync('fixtures/heading/expected-if-partial-custom.md')
          )
        ],
        'should support partial github/twitter fields'
      )
    })

  remark()
    .use(contributors, {
      contributors: [
        {name: 'Hugh Kennedy', github: 'hughsk', twitter: '@hughskennedy'},
        {
          github: 'https://github.com/timoxley',
          name: 'Tim Oxley',
          twitter: 'secoif'
        },
        {
          twitter: 'http://twitter.com/@rvagg/',
          github: 'rvagg',
          name: 'Rod Vagg'
        }
      ]
    })
    .process(vfile.readSync('fixtures/heading/index.md'), function (err, file) {
      t.deepEqual(
        [err, String(file)],
        [null, String(vfile.readSync('fixtures/heading/expected-complex.md'))],
        'should support complex profiles'
      )
    })

  remark()
    .use(contributors, {
      formatters: {
        // Defaults:
        name: false,
        email: true,
        // Others:
        alpha: false,
        bravo: true,
        charlie: null,
        delta: 'Delta',
        echo: {exclude: true},
        Foxtrot: {label: 'Foxtrot'}
      },
      contributors: [
        {
          name: 'Name',
          email: 'Email',
          alpha: 'Alpha',
          bravo: 'Bravo',
          charlie: 'Charlie',
          delta: 'Delta',
          echo: 'Echo',
          foxtrot: 'Foxtrot'
        }
      ]
    })
    .process(vfile.readSync('fixtures/heading/index.md'), function (err, file) {
      t.deepEqual(
        [err, String(file)],
        [
          null,
          String(vfile.readSync('fixtures/heading/expected-formatters.md'))
        ],
        'should support formatters'
      )
    })

  remark()
    .use(contributors, {
      formatters: {
        social: {
          label: 'Social',
          // To simplify this test, don't wrap in links etc.
          format: function (value) {
            var parts = value.split('@').length

            if (!value) {
              return null
            }

            // Check that returning multiple nodes works:
            if (parts > 2) {
              return [{type: 'text', value: value}]
            }

            return value ? '@' + value + '@twitter' : null
          }
        }
      },
      contributors: [
        {name: 'Sara', github: 'sara', social: '@sara@domain'},
        {name: 'Jason'},
        {name: 'Alice', social: 'alice'}
      ]
    })
    .process(vfile.readSync('fixtures/heading/index.md'), function (err, file) {
      t.deepEqual(
        [err, String(file)],
        [null, String(vfile.readSync('fixtures/heading/expected-format.md'))],
        'should support custom field formatters'
      )
    })

  remark()
    .use(contributors, {align: 'left'})
    .process(
      vfile.readSync('fixtures/heading-contributors/index.md'),
      function (err, file) {
        t.deepEqual(
          [err, String(file)],
          [
            null,
            String(
              vfile.readSync('fixtures/heading-contributors/expected-align.md')
            )
          ],
          'should support the align option'
        )
      }
    )

  remark()
    .use(contributors)
    .process(
      vfile.readSync('fixtures/heading-contributors/index.md'),
      function (err, file) {
        t.deepEqual(
          [err, String(file)],
          [
            null,
            String(vfile.readSync('fixtures/heading-contributors/expected.md'))
          ],
          'should read from `package.json` if no contributors are given'
        )
      }
    )

  remark()
    .use(contributors)
    .process(
      vfile.readSync(
        'fixtures/heading-contributors/deep/deeper/deepest/index.md'
      ),
      function (err, file) {
        t.deepEqual(
          [err, String(file)],
          [
            null,
            String(
              vfile.readSync(
                'fixtures/heading-contributors/deep/deeper/deepest/expected.md'
              )
            )
          ],
          'should find `package.json`s up from the given file'
        )
      }
    )

  remark()
    .use(contributors)
    .process(vfile.readSync('fixtures/invalid-package/index.md'), function (
      err
    ) {
      t.ok(
        /Unexpected end of JSON input/.test(err),
        'should not swallow invalid `package.json` errors'
      )
    })

  remark()
    .use(contributors)
    .process(vfile.readSync('fixtures/no-contributors/index.md'), function (
      err
    ) {
      t.ok(
        /Missing required `contributors` in settings/.test(err),
        'should throw if no contributors are given or found'
      )
    })
})
