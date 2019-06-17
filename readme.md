# remark-contributors

[![Build][build-badge]][build]
[![Coverage][coverage-badge]][coverage]
[![Downloads][downloads-badge]][downloads]
[![Size][size-badge]][size]
[![Sponsors][sponsors-badge]][collective]
[![Backers][backers-badge]][collective]
[![Chat][chat-badge]][chat]

[**remark**][remark] plugin to inject a given list of contributors into a table.

## Install

[npm][]:

```sh
npm install remark-contributors
```

## Use

Say we have the following file, `example.md`:

```markdown
# Example

Some text.

## Contributors

## License

MIT
```

And our script, `example.js`, looks as follows:

```js
var vfile = require('to-vfile')
var remark = require('remark')
var contributors = require('remark-contributors')

remark()
  .use(contributors)
  .process(vfile.readSync('example.md'), function(err, file) {
    if (err) throw err
    console.log(String(file))
  })
```

Now, running `node example` yields:

```markdown
# Example

Some text.

## Contributors

| Name                | Website                     |
| ------------------- | --------------------------- |
| **Hugh Kennedy**    | <https://hughsk.io>         |
| **Titus Wormer**    | <https://wooorm.com>        |
| **Vincent Weevers** | <https://vincentweevers.nl> |
| **Nick Baugh**      | <https://niftylettuce.com>  |

## License

MIT
```

## API

### `remark().use(contributors[, options])`

Inject a given list of contributors.

*   Looks for the first heading containing `'Contributors'` (case insensitive)
*   If no heading is found and `appendIfMissing` is set, inject such a heading
*   Replaces the table in that section if there is one, or injects it otherwise

##### Options

###### `options.contributors`

List of contributors to inject (`Array.<Object>`).
Defaults to the `contributors` field in the `package.json`, if there is one.
Supports the string form (`name <email> (url)`) as well.
Fails if no contributors are found or given.

###### `options.align`

Alignment to use for all cells in the table (`left`, `right`, `center`,
default: `null`).

###### `options.appendIfMissing`

Inject the section if there is none (`boolean`, default: `false`).

###### `options.formatters`

Map of fields found in `contributors` to formatters (`Object.<Formatter>`).
These given formatters extend the [default formatters][formatters].

The keys in `formatters` should correspond directly (case-sensitive) to keys in
`contributors`.

The values can be:

*   `null` or `undefined` — does nothing
*   `false` — shortcut for `{label: key, exclude: true}`, can be used to exclude
    default formatters
*   `true` — shortcut for `{label: key}`, can be used to include default
    formatters (like `email`)
*   `string` — shortcut for `{label: value}`
*   `Formatter` — …or a proper formatter object

Formatters have the following properties:

*   `label` — text in the header row that labels the column for this field
*   `exclude` — whether to ignore these fields (default: `false`)
*   `format` — function called with `value, key, contributor` to format
    the value.  Expected to return [PhrasingContent][].  Can return null or
    undefined (ignored), a string (wrapped in a [text][] node), a string that
    looks like a URL (wrapped in a [link][]), one node, or multiple nodes

##### Notes

*   Define fields other than `name`, `url`, `github`, or `twitter` in
    `formatters` to label them properly
*   By default, fields named `url` will be labelled `Website` (so that
    `package.json` contributors field is displayed nicely)
*   By default, fields named `email` are ignored
*   Name fields are displayed as strong
*   GitHub and Twitter URLs are automatically stripped and displayed with
    `@mention`s wrapped in an `https://` link
*   If a field is undefined for a given contributor, then the value will be an
    empty table cell
*   Columns are sorted in the order they are defined (first defined => first
    displayed)

## Related

*   [`remark-collapse`](https://github.com/Rokt33r/remark-collapse)
    – Make a section collapsible
*   [`remark-normalize-headings`](https://github.com/eush77/remark-normalize-headings)
    — Make sure there is no more than a single top-level heading in the document
    and rewrite the rest accordingly
*   [`remark-rewrite-headers`](https://github.com/strugee/remark-rewrite-headers)
    — Change header levels
*   [`remark-toc`](https://github.com/remarkjs/remark-toc)
    — Generate a Table of Contents (TOC)
*   [`remark-license`](https://github.com/remarkjs/remark-license)
    — Generate a license section

## Contribute

See [`contributing.md`][contributing] in [`remarkjs/.github`][health] for ways
to get started.
See [`support.md`][support] for ways to get help.

This project has a [Code of Conduct][coc].
By interacting with this repository, organisation, or community you agree to
abide by its terms.

## Contributors

| Name                | Website                     |
| ------------------- | --------------------------- |
| **Hugh Kennedy**    | <https://hughsk.io>         |
| **Titus Wormer**    | <https://wooorm.com>        |
| **Vincent Weevers** | <https://vincentweevers.nl> |
| **Nick Baugh**      | <https://niftylettuce.com>  |

## License

[MIT][license] © [Hugh Kennedy][author]

<!-- Definitions -->

[build-badge]: https://img.shields.io/travis/remarkjs/remark-contributors/master.svg

[build]: https://travis-ci.org/remarkjs/remark-contributors

[coverage-badge]: https://img.shields.io/codecov/c/github/remarkjs/remark-contributors.svg

[coverage]: https://codecov.io/github/remarkjs/remark-contributors

[downloads-badge]: https://img.shields.io/npm/dm/remark-contributors.svg

[downloads]: https://www.npmjs.com/package/remark-contributors

[size-badge]: https://img.shields.io/bundlephobia/minzip/remark-contributors.svg

[size]: https://bundlephobia.com/result?p=remark-contributors

[sponsors-badge]: https://opencollective.com/unified/sponsors/badge.svg

[backers-badge]: https://opencollective.com/unified/backers/badge.svg

[collective]: https://opencollective.com/unified

[chat-badge]: https://img.shields.io/badge/join%20the%20community-on%20spectrum-7b16ff.svg

[chat]: https://spectrum.chat/unified/remark

[npm]: https://docs.npmjs.com/cli/install

[health]: https://github.com/remarkjs/.github

[contributing]: https://github.com/remarkjs/.github/blob/master/contributing.md

[support]: https://github.com/remarkjs/.github/blob/master/support.md

[coc]: https://github.com/remarkjs/.github/blob/master/code-of-conduct.md

[license]: license

[author]: https://hughsk.io

[remark]: https://github.com/remarkjs/remark

[text]: https://github.com/syntax-tree/mdast#text

[link]: https://github.com/syntax-tree/mdast#link

[phrasingcontent]: https://github.com/syntax-tree/mdast/blob/master/readme.md#phrasingcontent

[formatters]: formatters.js
