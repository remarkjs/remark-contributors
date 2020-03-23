'use strict'

var test = require('tape')
var remark = require('remark')
var vfile = require('to-vfile')
var contributors = require('.')

test('remark-contributors', function (t) {
  t.plan(11)

  remark()
    .use(contributors)
    .process(vfile.readSync('fixtures/package.md'), function (err, file) {
      t.deepEqual(
        [err, String(file)],
        [null, String(vfile.readSync('fixtures/package.md'))],
        'should not add a section by default'
      )
    })

  remark()
    .use(contributors, {appendIfMissing: true})
    .process(vfile.readSync('fixtures/package.md'), function (err, file) {
      t.deepEqual(
        [err, String(file)],
        [null, String(vfile.readSync('fixtures/package-expected.md'))],
        'should add a section by default if none exists and `appendIfMissing: true`'
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
      ],
      appendIfMissing: true
    })
    .process(vfile.readSync('fixtures/custom.md'), function (err, file) {
      t.deepEqual(
        [err, String(file)],
        [null, String(vfile.readSync('fixtures/custom-expected.md'))],
        'should support custom fields'
      )
    })

  remark()
    .use(contributors, {
      contributors: [
        {name: 'Sara', github: 'sara'},
        {name: 'Jason'},
        {name: 'Alice', twitter: 'alice'}
      ],
      appendIfMissing: true
    })
    .process(vfile.readSync('fixtures/partial.md'), function (err, file) {
      t.deepEqual(
        [err, String(file)],
        [null, String(vfile.readSync('fixtures/partial-expected.md'))],
        'should support partial github/twitter fields'
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
    .process(vfile.readSync('fixtures/formatters.md'), function (err, file) {
      t.deepEqual(
        [err, String(file)],
        [null, String(vfile.readSync('fixtures/formatters-expected.md'))],
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
      ],
      appendIfMissing: true
    })
    .process(vfile.readSync('fixtures/format.md'), function (err, file) {
      t.deepEqual(
        [err, String(file)],
        [null, String(vfile.readSync('fixtures/format-expected.md'))],
        'should support custom field formatters'
      )
    })

  remark()
    .use(contributors)
    .process(
      vfile.readSync({
        path: 'index.md',
        cwd: 'fixtures/valid-package'
      }),
      function (err, file) {
        t.deepEqual(
          [err, String(file)],
          [null, String(vfile.readSync('fixtures/valid-package/expected.md'))],
          'should read from `package.json` if no contributors are given'
        )
      }
    )

  remark()
    .use(contributors)
    .process(
      vfile.readSync({
        path: 'index.md',
        cwd: 'fixtures/invalid-package'
      }),
      function (err) {
        t.ok(
          /Unexpected end of JSON input/.test(err),
          'should not swallow invalid `package.json` errors'
        )
      }
    )

  remark()
    .use(contributors)
    .process(
      vfile.readSync({
        path: 'index.md',
        cwd: 'fixtures/missing-package'
      }),
      function (err) {
        t.ok(
          /Missing required `contributors` in settings/.test(err),
          'should throw if no contributors are given or found'
        )
      }
    )

  remark()
    .use(contributors, {align: 'left'})
    .process(vfile.readSync('fixtures/align.md'), function (err, file) {
      t.deepEqual(
        [err, String(file)],
        [null, String(vfile.readSync('fixtures/align-expected.md'))],
        'should support the align option'
      )
    })

  t.test('Fixtures', function (st) {
    var fixtures = [
      {
        label: 'Adds section if none exists',
        input: vfile.readSync('fixtures/basic.md'),
        expected: vfile.readSync('fixtures/basic-expected.md')
      },
      {
        label: 'Replaces table if present in section',
        input: vfile.readSync('fixtures/replace-table.md'),
        expected: vfile.readSync('fixtures/replace-table-expected.md')
      },
      {
        label: 'Adds table if not present in section',
        input: vfile.readSync('fixtures/add-table.md'),
        expected: vfile.readSync('fixtures/add-table-expected.md')
      }
    ]

    st.plan(fixtures.length)

    fixtures.forEach(function (fixture) {
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
          ],
          appendIfMissing: true
        })
        .process(fixture.input, function (err, file) {
          st.deepEqual(
            [err, String(file)],
            [null, String(fixture.expected)],
            fixture.label
          )
        })
    })
  })
})
