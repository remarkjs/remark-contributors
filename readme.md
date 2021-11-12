# remark-contributors

[![Build][build-badge]][build]
[![Coverage][coverage-badge]][coverage]
[![Downloads][downloads-badge]][downloads]
[![Size][size-badge]][size]
[![Sponsors][sponsors-badge]][collective]
[![Backers][backers-badge]][collective]
[![Chat][chat-badge]][chat]

**[remark][]** plugin to generate a list of contributors.

## Contents

*   [What is this?](#what-is-this)
*   [When should I use this?](#when-should-i-use-this)
*   [Install](#install)
*   [Use](#use)
*   [API](#api)
    *   [`unified().use(remarkContributors[, options])`](#unifieduseremarkcontributors-options)
*   [Examples](#examples)
    *   [Example: passing contributors](#example-passing-contributors)
    *   [Example: formatters](#example-formatters)
*   [Types](#types)
*   [Compatibility](#compatibility)
*   [Security](#security)
*   [Related](#related)
*   [Contribute](#contribute)
*   [Contributors](#contributors)
*   [License](#license)

## What is this?

This package is a [unified][] ([remark][]) plugin that takes a list of
contributors and adds them in a table to a `## Contributors` heading.

**unified** is a project that transforms content with abstract syntax trees
(ASTs).
**remark** adds support for markdown to unified.
**mdast** is the markdown AST that remark uses.
This is a remark plugin that transforms mdast.

## When should I use this?

This project is useful when you’re writing documentation for a project,
typically a Node.js package, that has one or more readmes and maybe some other
markdown files as well.
You want to show who helped build the project by adding their names, websites,
and perhaps some more info.
This package is useful because it’s automated: you can customize who is added
and how that’s formatted.
But it won’t be as expressive as writing such sections manually.

This plugin is used in [`remark-git-contributors`][remark-git-contributors].
The difference is that that plugin takes the Git history into account, which
isn’t always needed or correct.

## Install

This package is [ESM only](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c).
In Node.js (version 12.20+, 14.14+, or 16.0+), install with [npm][]:

```sh
npm install remark-contributors
```

In Deno with [Skypack][]:

```js
import remarkContributors from 'https://cdn.skypack.dev/remark-contributors@6?dts'
```

In browsers with [Skypack][]:

```html
<script type="module">
  import remarkContributors from 'https://cdn.skypack.dev/remark-contributors@6?min'
</script>
```

## Use

Say we have the following file `example.md` in this project:

```markdown
# Example

Some text.

## Contributors

## License

MIT
```

And our module `example.js` looks as follows:

```js
import {read} from 'to-vfile'
import {remark} from 'remark'
import remarkGfm from 'remark-gfm'
import remarkContributors from 'remark-contributors'

main()

async function main() {
  const file = await remark()
    .use(remarkGfm) // Required: add support for tables (a GFM feature).
    .use(remarkContributors)
    .process(await read('example.md'))

  console.log(String(file))
}
```

Now running `node example.js` yields:

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

> 👉 **Note**: These contributors are inferred from this project’s
> [`package.json`][package-json].
> Running this example in a different package will yield different results.

## API

This package exports no identifiers.
The default export is `remarkContributors`.

### `unified().use(remarkContributors[, options])`

Generate a list of contributors.
In short, this plugin:

*   looks for the first heading matching `/^contributors$/i` or `options.heading`
*   if no heading is found and `appendIfMissing` is set, injects such a heading
*   if there is a heading, replaces everything in that section with a new table

##### `options`

Configuration (optional in Node.js, required in browsers).

###### `options.contributors`

List of contributors to inject (`Array<Object>`).
In Node.js, defaults to the `contributors` field in the closest `package.json`
upwards from the processed [file][vfile], if there is one.
Supports the string form (`name <email> (url)`) as well.
Fails if no contributors are found or given.

###### `options.align`

Alignment to use for all cells in the table (`'left' | 'right' | 'center' |
null`, default: `null`).

###### `options.appendIfMissing`

Whether to add a `## Contributors` section if none exists (`boolean`, default:
`false`).
The default does nothing when the section doesn’t exist so that you have to
choose where and if the section is added.

###### `options.heading`

Heading to look for (`string` (case-insensitive) or `RegExp`, default:
`'contributors'`).

###### `options.formatters`

Map of fields found in `contributors` to formatters (`Record<string,
Formatter>`).
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
    the value.
    Expected to return [PhrasingContent][].
    Can return `null` or `undefined` (ignored), `string` (wrapped in a [text][]
    node), `string` that looks like a URL (wrapped in a [link][]), one `Node`,
    or `Array<Node>`

##### Notes

*   define fields other than `name`, `url`, `github`, or `twitter` in
    `formatters` to label them properly
*   by default, fields named `url` will be labelled `Website` (so that
    `package.json` contributors field is displayed nicely)
*   by default, fields named `email` are ignored
*   Name fields are displayed as strong
*   GitHub and Twitter URLs are automatically stripped and displayed with
    `@mention`s wrapped in an `https://` link
*   if a field is undefined for a given contributor, then the value will be an
    empty table cell
*   columns are sorted in the order they are defined (first defined => first
    displayed)

## Examples

### Example: passing contributors

The following example shows how contributors can be passed:

```js
import {remark} from 'remark'
import remarkGfm from 'remark-gfm'
import remarkContributors from './index.js'

main()

async function main() {
  const file = await remark()
    .use(remarkGfm)
    .use(remarkContributors, {
      contributors: [
        // String form:
        'Jane Doe <jane@doe.com> (https://example.com/jane)',
        // Object form, with just a name:
        {name: 'John Doe'},
        // Some more info:
        {name: 'Mona Lisa', url: 'https://github.com/monatheoctocat'}
      ]
    })
    .process('## Contributors')

  console.log(String(file))
}
```

Yields:

```markdown
## Contributors

| Name          | Website                             |
| ------------- | ----------------------------------- |
| **Jane Doe**  | <https://example.com/jane>          |
| **John Doe**  |                                     |
| **Mona Lisa** | <https://github.com/monatheoctocat> |
```

### Example: formatters

By default, unknown fields in contributors will be added to the table:

```js
import {remark} from 'remark'
import remarkGfm from 'remark-gfm'
import remarkContributors from 'remark-contributors'

main()

async function main() {
  const file = await remark()
    .use(remarkGfm)
    .use(remarkContributors, {
      contributors: [
        {name: 'Jane Doe', age: 31, topping: 'Mozzarella'},
        {name: 'John Doe', age: 29, topping: 'Olive'},
        {name: 'Mona Lisa', age: 3, topping: 'Pineapple'}
      ]
    })
    .process('## Contributors')

  console.log(String(file))
}
```

Yields:

```markdown
## Contributors

| Name          | age | topping    |
| ------------- | --- | ---------- |
| **Jane Doe**  | 31  | Mozzarella |
| **John Doe**  | 29  | Olive      |
| **Mona Lisa** | 3   | Pineapple  |
```

It’s possible to customize how these new fields are formatted:

```diff
@@ -12,7 +12,16 @@ async function main() {
         {name: 'Jane Doe', age: 31, topping: 'Mozzarella'},
         {name: 'John Doe', age: 29, topping: 'Olive'},
         {name: 'Mona Lisa', age: 3, topping: 'Pineapple'}
-      ]
+      ],
+      formatters: {
+        age: {
+          label: 'Age',
+          format(d) {
+            return {type: 'emphasis', children: [{type: 'text', value: String(d)}]}
+          }
+        },
+        topping: 'Topping'
+      }
     })
     .process('## Contributors')
```

Yields:

```markdown
| Name          | Age  | Topping    |
| ------------- | ---- | ---------- |
| **Jane Doe**  | *31* | Mozzarella |
| **John Doe**  | *29* | Olive      |
| **Mona Lisa** | *3*  | Pineapple  |
```

> 👉 **Note**: Observe that the labels of `Age` and `Topping` are now cased,
> and that the age values are now wrapped in emphasis.

## Types

This package is fully typed with [TypeScript][].
It exports additional `Format`, `FormatterObject`, `Formatter`, `Formatters`,
`ContributorObject`, `Contributor`, and `Options` types, which model these
respective interfaces.

## Compatibility

Projects maintained by the unified collective are compatible with all maintained
versions of Node.js.
As of now, that is Node.js 12.20+, 14.14+, and 16.0+.
Our projects sometimes work with older versions, but this is not guaranteed.

This plugin works with `unified` version 6+ and `remark` version 7+.

## Security

`options.contributors` (or `contributors` in `package.json`) is used and
injected into the tree when given or found.
Data in those lists is formatted by `options.formatters`.
If a user has access to either, this could open you up to a
[cross-site scripting (XSS)][xss] attack.

This may become a problem if the markdown is later transformed to
**[rehype][]** (**[hast][]**) or opened in an unsafe markdown viewer.

## Related

*   [`remark-git-contributors`][remark-git-contributors]
    – very similar to this plugin but uses info from Git
*   [`remark-collapse`](https://github.com/Rokt33r/remark-collapse)
    – make a section collapsible
*   [`remark-normalize-headings`](https://github.com/remarkjs/remark-normalize-headings)
    — make sure there is a single top level heading in a document by adjusting
    heading ranks accordingly
*   [`remark-behead`](https://github.com/mrzmmr/remark-behead)
    — increase or decrease markdown heading ranks
*   [`remark-toc`](https://github.com/remarkjs/remark-toc)
    — generate a table of contents (TOC)
*   [`remark-license`](https://github.com/remarkjs/remark-license)
    — generate a license section

## Contribute

See [`contributing.md`][contributing] in [`remarkjs/.github`][health] for ways
to get started.
See [`support.md`][support] for ways to get help.

This project has a [code of conduct][coc].
By interacting with this repository, organization, or community you agree to
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

[build-badge]: https://github.com/remarkjs/remark-contributors/workflows/main/badge.svg

[build]: https://github.com/remarkjs/remark-contributors/actions

[coverage-badge]: https://img.shields.io/codecov/c/github/remarkjs/remark-contributors.svg

[coverage]: https://codecov.io/github/remarkjs/remark-contributors

[downloads-badge]: https://img.shields.io/npm/dm/remark-contributors.svg

[downloads]: https://www.npmjs.com/package/remark-contributors

[size-badge]: https://img.shields.io/bundlephobia/minzip/remark-contributors.svg

[size]: https://bundlephobia.com/result?p=remark-contributors

[sponsors-badge]: https://opencollective.com/unified/sponsors/badge.svg

[backers-badge]: https://opencollective.com/unified/backers/badge.svg

[collective]: https://opencollective.com/unified

[chat-badge]: https://img.shields.io/badge/chat-discussions-success.svg

[chat]: https://github.com/remarkjs/remark/discussions

[npm]: https://docs.npmjs.com/cli/install

[skypack]: https://www.skypack.dev

[health]: https://github.com/remarkjs/.github

[contributing]: https://github.com/remarkjs/.github/blob/HEAD/contributing.md

[support]: https://github.com/remarkjs/.github/blob/HEAD/support.md

[coc]: https://github.com/remarkjs/.github/blob/HEAD/code-of-conduct.md

[license]: license

[author]: https://hughsk.io

[remark]: https://github.com/remarkjs/remark

[unified]: https://github.com/unifiedjs/unified

[text]: https://github.com/syntax-tree/mdast#text

[link]: https://github.com/syntax-tree/mdast#link

[phrasingcontent]: https://github.com/syntax-tree/mdast/blob/HEAD/readme.md#phrasingcontent

[formatters]: lib/formatters.js

[package-json]: package.json

[xss]: https://en.wikipedia.org/wiki/Cross-site_scripting

[typescript]: https://www.typescriptlang.org

[rehype]: https://github.com/rehypejs/rehype

[hast]: https://github.com/syntax-tree/hast

[vfile]: https://github.com/vfile/vfile

[remark-git-contributors]: https://github.com/remarkjs/remark-git-contributors
