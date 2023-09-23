import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import test from 'node:test'
import {remark} from 'remark'
import remarkGfm from 'remark-gfm'
import {read} from 'to-vfile'
import {VFile} from 'vfile'
import remarkContributors from '../index.js'

test('remarkContributors', async function (t) {
  // Prepare.
  // Hide our project’s `package.json`.
  await fs.rename('package.json', 'package.json.bak')

  // Tests.
  await t.test('should expose the public api', async function () {
    assert.deepEqual(Object.keys(await import('../index.js')).sort(), [
      'default'
    ])
  })

  await t.test('should not add a section by default', async function () {
    const file = await read(
      new URL('fixtures/no-heading/index.md', import.meta.url)
    )
    await remark().use(remarkGfm).use(remarkContributors).process(file)

    assert.equal(
      String(file),
      String(
        await read(new URL('fixtures/no-heading/expected.md', import.meta.url))
      )
    )
  })

  await t.test(
    'should add a section if none exists and `appendIfMissing: true`',
    async function () {
      const file = await read(
        new URL('fixtures/no-heading/index.md', import.meta.url)
      )
      await remark()
        .use(remarkGfm)
        .use(remarkContributors, {appendIfMissing: true})
        .process(file)

      assert.equal(
        String(file),
        String(
          await read(
            new URL(
              'fixtures/no-heading/expected-if-append.md',
              import.meta.url
            )
          )
        )
      )
    }
  )

  await t.test('should replace an existing table', async function () {
    const file = await read(
      new URL('fixtures/existing/index.md', import.meta.url)
    )
    await remark().use(remarkGfm).use(remarkContributors).process(file)

    assert.equal(
      String(file),
      String(
        await read(new URL('fixtures/existing/expected.md', import.meta.url))
      )
    )
  })

  await t.test('should not replace other tables', async function () {
    const file = await read(
      new URL('fixtures/other-table/index.md', import.meta.url)
    )
    await remark().use(remarkGfm).use(remarkContributors).process(file)

    assert.equal(
      String(file),
      String(
        await read(new URL('fixtures/other-table/expected.md', import.meta.url))
      )
    )
  })

  await t.test('should support custom fields', async function () {
    const file = await read(
      new URL('fixtures/heading/index.md', import.meta.url)
    )
    await remark()
      .use(remarkGfm)
      .use(remarkContributors, {
        formatters: {
          age: 'Age',
          commits: 'Commits',
          name: null,
          term: 'Term',
          youtube: 'YouTube'
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
      .process(file)

    assert.equal(
      String(file),
      String(
        await read(
          new URL('fixtures/heading/expected-if-custom.md', import.meta.url)
        )
      )
    )
  })

  await t.test(
    'should support partial github/twitter fields',
    async function () {
      const file = await read(
        new URL('fixtures/heading/index.md', import.meta.url)
      )
      await remark()
        .use(remarkGfm)
        .use(remarkContributors, {
          contributors: [
            {name: 'Sara', github: 'sara'},
            {name: 'Jason'},
            {name: 'Alice', twitter: 'alice'}
          ]
        })
        .process(file)

      assert.equal(
        String(file),
        String(
          await read(
            new URL(
              'fixtures/heading/expected-if-partial-custom.md',
              import.meta.url
            )
          )
        )
      )
    }
  )

  await t.test('should support complex profiles', async function () {
    const file = await read(
      new URL('fixtures/heading/index.md', import.meta.url)
    )
    await remark()
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
      .process(file)

    assert.equal(
      String(file),
      String(
        await read(
          new URL('fixtures/heading/expected-complex.md', import.meta.url)
        )
      )
    )
  })

  await t.test('should support formatters', async function () {
    const file = await read(
      new URL('fixtures/heading/index.md', import.meta.url)
    )
    await remark()
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
      .process(file)

    assert.equal(
      String(file),
      String(
        await read(
          new URL('fixtures/heading/expected-formatters.md', import.meta.url)
        )
      )
    )
  })

  await t.test('should support custom field formatters', async function () {
    const file = await read(
      new URL('fixtures/heading/index.md', import.meta.url)
    )
    await remark()
      .use(remarkGfm)
      .use(remarkContributors, {
        formatters: {
          social: {
            label: 'Social',
            // To simplify this test, don't wrap in links etc.
            format(raw) {
              const value = String(raw)
              const parts = value.split('@').length

              if (!value) return null

              // Check that returning multiple nodes works:
              if (parts > 2) return [{type: 'text', value}]

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
      .process(file)

    assert.equal(
      String(file),
      String(
        await read(
          new URL('fixtures/heading/expected-format.md', import.meta.url)
        )
      )
    )
  })

  await t.test('should support the align option', async function () {
    const file = await read(
      new URL('fixtures/heading-contributors/index.md', import.meta.url)
    )
    await remark()
      .use(remarkGfm)
      .use(remarkContributors, {align: 'left'})
      .process(file)

    assert.equal(
      String(file),
      String(
        await read(
          new URL(
            'fixtures/heading-contributors/expected-align.md',
            import.meta.url
          )
        )
      )
    )
  })

  await t.test(
    'should read from `package.json` if no contributors are given',
    async function () {
      const file = await read(
        new URL('fixtures/heading-contributors/index.md', import.meta.url)
      )
      await remark().use(remarkGfm).use(remarkContributors).process(file)

      assert.equal(
        String(file),
        String(
          await read(
            new URL(
              'fixtures/heading-contributors/expected.md',
              import.meta.url
            )
          )
        )
      )
    }
  )

  await t.test(
    'should find `package.json`s up from the given file',
    async function () {
      const file = await read(
        new URL(
          'fixtures/heading-contributors/deep/deeper/deepest/index.md',
          import.meta.url
        )
      )
      await remark().use(remarkGfm).use(remarkContributors).process(file)

      assert.equal(
        String(file),
        String(
          await read(
            new URL(
              'fixtures/heading-contributors/deep/deeper/deepest/expected.md',
              import.meta.url
            )
          )
        )
      )
    }
  )

  await t.test('should throw if no `path` is on `file`', async function () {
    const file = new VFile('...')

    try {
      await remark().use(remarkGfm).use(remarkContributors).process(file)
      assert.fail()
    } catch (error) {
      assert.match(String(error), /Missing required `path` on `file`/)
    }
  })

  await t.test(
    'should not swallow invalid `package.json` errors',
    async function () {
      const packageUrl = new URL(
        'fixtures/invalid-package/package.json',
        import.meta.url
      )
      const file = await read(
        new URL('fixtures/invalid-package/index.md', import.meta.url)
      )

      await fs.writeFile(packageUrl, '{\n  "contributors": [\n')

      try {
        await remark().use(remarkGfm).use(remarkContributors).process(file)
        assert.fail()
      } catch (error) {
        assert.match(String(error), /Unexpected end of JSON input/)
      }

      await fs.unlink(packageUrl)
    }
  )

  await t.test(
    'should throw if no contributors are given or found',
    async function () {
      const file = await read(
        new URL('fixtures/no-contributors/index.md', import.meta.url)
      )

      try {
        await remark().use(remarkGfm).use(remarkContributors).process(file)
        assert.fail()
      } catch (error) {
        assert.match(
          String(error),
          /Missing required `contributors` in settings/
        )
      }
    }
  )

  await t.test(
    'should match custom heading if `heading` option is passed a regex',
    async function () {
      const file = await read(
        new URL('fixtures/match-heading/index.md', import.meta.url)
      )
      await remark()
        .use(remarkGfm)
        .use(remarkContributors, {heading: /^mitwirkende$/i})
        .process(file)

      assert.equal(
        String(file),
        String(
          await read(
            new URL('fixtures/match-heading/expected.md', import.meta.url)
          )
        )
      )
    }
  )

  await t.test(
    'should match custom heading if `heading` option is passed a string',
    async function () {
      const file = await read(
        new URL('fixtures/match-heading/index.md', import.meta.url)
      )
      await remark()
        .use(remarkGfm)
        .use(remarkContributors, {heading: 'mitwirkende'})
        .process(file)

      assert.equal(
        String(file),
        String(
          await read(
            new URL('fixtures/match-heading/expected.md', import.meta.url)
          )
        )
      )
    }
  )

  await fs.rename('package.json.bak', 'package.json')
})
