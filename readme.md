# remark-contributors

[![Build][build-badge]][build]
[![Coverage][coverage-badge]][coverage]
[![Downloads][downloads-badge]][downloads]
[![Chat][chat-badge]][chat]

Generate a Contributors section with **[remark][]**.

## Installation

[npm][]:

```bash
npm install remark-contributors
```

## Usage

Say we have the following file, `example.md`:

```markdown
# Example

Some text.

## Contributors

## License

MIT
```

And our script, `example.js`, looks as follows:

```javascript
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

| Name           | Website                   |
| -------------- | ------------------------- |
| **Nick Baugh** | <http://niftylettuce.com> |

## License

MIT
```

## API

### `remark().use(contributors[, options])`

Add a Contributors section.

*   Looks for the first heading containing `'Contributors'` (case insensitive)
*   If no heading is found and `appendIfMissing` is set, inject such a heading
*   Replaces the table in that section if there is one, or injects it otherwise

##### Options

###### `options.contributors`

List of contributors to inject (`Array.<Object>`).
Defaults to the `contributors` field in the `package.json`, if there is one.

###### `options.align`

Alignment to use for all cells in the table (`left`, `right`, `center`,
default: `null`).

###### `options.appendIfMissing`

Inject the section if there is none (`boolean`, default: `false`).

##### Notes

### Notes

*   If there are custom fields other than `name`, `url`, `github`, or `twitter`,
    you should use proper casing (such as Dribbble) when defining contributors
*   Fields named `url` will be automatically renamed to `Website` for display
    purposes (e.g. in `package.json` contributors field)
*   Emails are automatically removed from being displayed
*   If a field is undefined for a given contributor, then the value will be set
    to an empty string automatically
*   Header names are displayed in the order they are defined (first defined =>
    first displayed)
*   GitHub and Twitter URL’s are automatically stripped and displayed with
    `@mention`s wrapped in an `https://` link

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

## Contributors

| Name                | Website                     |
| ------------------- | --------------------------- |
| **Hugh Kennedy**    | <https://hughsk.io>         |
| **Titus Wormer**    | <https://wooorm.com>        |
| **Vincent Weevers** | <https://vincentweevers.nl> |
| **Nick Baugh**      | <https://niftylettuce.com>  |

## License

[MIT][license] © [Titus Wormer][author]

<!-- Definitions -->

[build-badge]: https://img.shields.io/travis/hughsk/remark-contributors.svg

[build]: https://travis-ci.org/hughsk/remark-contributors

[coverage-badge]: https://img.shields.io/codecov/c/github/hughsk/remark-contributors.svg

[coverage]: https://codecov.io/github/hughsk/remark-contributors

[downloads-badge]: https://img.shields.io/npm/dm/remark-contributors.svg

[downloads]: https://www.npmjs.com/package/remark-contributors

[chat-badge]: https://img.shields.io/badge/join%20the%20community-on%20spectrum-7b16ff.svg

[chat]: https://spectrum.chat/unified/remark

[license]: license

[author]: https://wooorm.com

[npm]: https://docs.npmjs.com/cli/install

[remark]: https://github.com/remarkjs/remark
