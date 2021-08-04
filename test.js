import fs from 'fs'
import path from 'path'
import test from 'tape'
import {remark} from 'remark'
import remarkGfm from 'remark-gfm'
import {toVFile} from 'to-vfile'
import remarkContributors from './index.js'

// Hide our project’s `package.json`.
try {
  fs.renameSync('package.json', 'package.json.bak')
} catch (_) {}

test.onFinish(ondone)

test('remarkContributors', function (t) {
  t.plan(17)

  remark()
    .use(remarkGfm)
    .use(remarkContributors)
    .process(
      read(path.join('fixtures', 'no-heading', 'index.md')),
      function (error, file) {
        t.deepEqual(
          [error, String(file)],
          [
            null,
            String(read(path.join('fixtures', 'no-heading', 'expected.md')))
          ],
          'should not add a section by default'
        )
      }
    )

  remark()
    .use(remarkGfm)
    .use(remarkContributors, {appendIfMissing: true})
    .process(
      read(path.join('fixtures', 'no-heading', 'index.md')),
      function (error, file) {
        t.deepEqual(
          [error, String(file)],
          [
            null,
            String(
              read(path.join('fixtures', 'no-heading', 'expected-if-append.md'))
            )
          ],
          'should add a section if none exists and `appendIfMissing: true`'
        )
      }
    )

  remark()
    .use(remarkGfm)
    .use(remarkContributors)
    .process(
      read(path.join('fixtures', 'existing', 'index.md')),
      function (error, file) {
        t.deepEqual(
          [error, String(file)],
          [
            null,
            String(read(path.join('fixtures', 'existing', 'expected.md')))
          ],
          'should replace an existing table'
        )
      }
    )

  remark()
    .use(remarkGfm)
    .use(remarkContributors)
    .process(
      read(path.join('fixtures', 'other-table', 'index.md')),
      function (error, file) {
        t.deepEqual(
          [error, String(file)],
          [
            null,
            String(read(path.join('fixtures', 'other-table', 'expected.md')))
          ],
          'should not replace other tables'
        )
      }
    )

  remark()
    .use(remarkGfm)
    .use(remarkContributors, {
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
    .process(
      read(path.join('fixtures', 'heading', 'index.md')),
      function (error, file) {
        t.deepEqual(
          [error, String(file)],
          [
            null,
            String(
              read(path.join('fixtures', 'heading', 'expected-if-custom.md'))
            )
          ],
          'should support custom fields'
        )
      }
    )

  remark()
    .use(remarkGfm)
    .use(remarkContributors, {
      contributors: [
        {name: 'Sara', github: 'sara'},
        {name: 'Jason'},
        {name: 'Alice', twitter: 'alice'}
      ]
    })
    .process(
      read(path.join('fixtures', 'heading', 'index.md')),
      function (error, file) {
        t.deepEqual(
          [error, String(file)],
          [
            null,
            String(
              read(
                path.join(
                  'fixtures',
                  'heading',
                  'expected-if-partial-custom.md'
                )
              )
            )
          ],
          'should support partial github/twitter fields'
        )
      }
    )

  remark()
    .use(remarkGfm)
    .use(remarkContributors, {
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
    .process(
      read(path.join('fixtures', 'heading', 'index.md')),
      function (error, file) {
        t.deepEqual(
          [error, String(file)],
          [
            null,
            String(
              read(path.join('fixtures', 'heading', 'expected-complex.md'))
            )
          ],
          'should support complex profiles'
        )
      }
    )

  remark()
    .use(remarkGfm)
    .use(remarkContributors, {
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
    .process(
      read(path.join('fixtures', 'heading', 'index.md')),
      function (error, file) {
        t.deepEqual(
          [error, String(file)],
          [
            null,
            String(
              read(path.join('fixtures', 'heading', 'expected-formatters.md'))
            )
          ],
          'should support formatters'
        )
      }
    )

  remark()
    .use(remarkGfm)
    .use(remarkContributors, {
      formatters: {
        social: {
          label: 'Social',
          // To simplify this test, don't wrap in links etc.
          format(value) {
            var parts = value.split('@').length

            if (!value) {
              return null
            }

            // Check that returning multiple nodes works:
            if (parts > 2) {
              return [{type: 'text', value}]
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
    .process(
      read(path.join('fixtures', 'heading', 'index.md')),
      function (error, file) {
        t.deepEqual(
          [error, String(file)],
          [
            null,
            String(read(path.join('fixtures', 'heading', 'expected-format.md')))
          ],
          'should support custom field formatters'
        )
      }
    )

  remark()
    .use(remarkGfm)
    .use(remarkContributors, {align: 'left'})
    .process(
      read(path.join('fixtures', 'heading-contributors', 'index.md')),
      function (error, file) {
        t.deepEqual(
          [error, String(file)],
          [
            null,
            String(
              read(
                path.join(
                  'fixtures',
                  'heading-contributors',
                  'expected-align.md'
                )
              )
            )
          ],
          'should support the align option'
        )
      }
    )

  remark()
    .use(remarkGfm)
    .use(remarkContributors)
    .process(
      read(path.join('fixtures', 'heading-contributors', 'index.md')),
      function (error, file) {
        t.deepEqual(
          [error, String(file)],
          [
            null,
            String(
              read(path.join('fixtures', 'heading-contributors', 'expected.md'))
            )
          ],
          'should read from `package.json` if no contributors are given'
        )
      }
    )

  remark()
    .use(remarkGfm)
    .use(remarkContributors)
    .process(
      read(
        path.join(
          'fixtures',
          'heading-contributors',
          'deep',
          'deeper',
          'deepest',
          'index.md'
        )
      ),
      function (error, file) {
        t.deepEqual(
          [error, String(file)],
          [
            null,
            String(
              read(
                path.join(
                  'fixtures',
                  'heading-contributors',
                  'deep',
                  'deeper',
                  'deepest',
                  'expected.md'
                )
              )
            )
          ],
          'should find `package.json`s up from the given file'
        )
      }
    )

  remark()
    .use(remarkGfm)
    .use(remarkContributors)
    .process(toVFile({value: '...'}), function (error) {
      t.ok(
        /Missing required `path` on `file`/.test(error),
        'should throw if no `path` is on `file`'
      )
    })

  fs.writeFileSync(
    path.join('fixtures', 'invalid-package', 'package.json'),
    '{\n  "contributors": [\n'
  )

  remark()
    .use(remarkGfm)
    .use(remarkContributors)
    .process(
      read(path.join('fixtures', 'invalid-package', 'index.md')),
      function (error) {
        fs.unlinkSync(path.join('fixtures', 'invalid-package', 'package.json'))
        t.ok(
          /Unexpected end of JSON input/.test(error),
          'should not swallow invalid `package.json` errors'
        )
      }
    )

  remark()
    .use(remarkGfm)
    .use(remarkContributors)
    .process(
      read(path.join('fixtures', 'no-contributors', 'index.md')),
      function (error) {
        t.ok(
          /Missing required `contributors` in settings/.test(error),
          'should throw if no contributors are given or found'
        )
      }
    )

  remark()
    .use(remarkGfm)
    .use(remarkContributors, {
      heading: /^mitwirkende$/i
    })
    .process(
      read(path.join('fixtures', 'match-heading', 'index.md')),
      function (error, file) {
        t.deepEqual(
          [error, String(file)],
          [
            null,
            String(read(path.join('fixtures', 'match-heading', 'expected.md')))
          ],
          'should match custom heading if `heading` option is passed a regex'
        )
      }
    )

  remark()
    .use(remarkGfm)
    .use(remarkContributors, {
      heading: 'mitwirkende'
    })
    .process(
      read(path.join('fixtures', 'match-heading', 'index.md')),
      function (error, file) {
        t.deepEqual(
          [error, String(file)],
          [
            null,
            String(read(path.join('fixtures', 'match-heading', 'expected.md')))
          ],
          'should match custom heading if `heading` option is passed a string'
        )
      }
    )
})

function read(fp) {
  var file = toVFile.readSync(fp)
  file.value = String(file).replace(/\r\n/g, '\n')
  return file
}

function ondone() {
  try {
    fs.renameSync('package.json.bak', 'package.json')
  } catch (_) {}
}
