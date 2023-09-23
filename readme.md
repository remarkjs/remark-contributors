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
    *   [`Contributor`](#contributor)
    *   [`ContributorObject`](#contributorobject)
    *   [`Format`](#format)
    *   [`Formatter`](#formatter)
    *   [`FormatterObject`](#formatterobject)
    *   [`Formatters`](#formatters)
    *   [`Options`](#options)
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

This package is [ESM only][esm].
In Node.js (version 16+), install with [npm][]:

```sh
npm install remark-contributors
```

In Deno with [`esm.sh`][esmsh]:

```js
import remarkContributors from 'https://esm.sh/remark-contributors@6'
```

In browsers with [`esm.sh`][esmsh]:

```html
<script type="module">
  import remarkContributors from 'https://esm.sh/remark-contributors@6?bundle'
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

…and a module `example.js`:

```js
import {remark} from 'remark'
import remarkContributors from 'remark-contributors'
import remarkGfm from 'remark-gfm'
import {read} from 'to-vfile'

const file = await remark()
  .use(remarkGfm) // This is needed to add support for tables (a GFM feature).
  .use(remarkContributors)
  .process(await read('example.md'))

console.log(String(file))
```

…then running `node example.js` yields:

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

> 👉 **Note**: These contributors are inferred from the
> [`package.json`][file-package-json] in this project.
> Running this example in a different package will yield different results.

## API

This package exports no identifiers.
The default export is [`remarkContributors`][api-remark-contributors].

### `unified().use(remarkContributors[, options])`

Generate a list of contributors.

In short, this plugin:

*   looks for the first heading matching `/^contributors$/i` or `options.heading`
*   if no heading is found and `appendIfMissing` is set, injects such a heading
*   if there is a heading, replaces everything in that section with a new table

###### Parameters

*   `options` ([`Options`][api-options], optional)
    — configuration

###### Returns

Transform ([`Transformer`][unified-transformer]).

##### Notes

*   define fields other than `name`, `url`, `github`, or `twitter` in
    `formatters` to label them properly
*   by default, fields named `url` will be labelled `Website` (so that
    `package.json` contributors field is displayed nicely)
*   by default, fields named `email` are ignored
*   name fields are displayed as strong
*   GitHub and Twitter URLs are automatically stripped and displayed with
    `@mention`s wrapped in an `https://` link
*   if a field is undefined for a given contributor, then the value will be an
    empty table cell
*   columns are sorted in the order they are defined (first defined means first
    displayed)

### `Contributor`

Contributor in string form (`name <email> (url)`) or as object (TypeScript
type).

###### Type

```ts
type Contributor = ContributorObject | string
```

### `ContributorObject`

Contributor with fields (TypeScript type).

###### Type

```ts
type ContributorObject = Record<string, unknown>
```

### `Format`

Format a field (TypeScript type).

###### Parameters

*   `value` (`unknown`)
    — value to format
*   `key` (`string`)
    — name of a field in a contributor
*   `contributor` ([`Contributor`][api-contributor])
    — whole contributor

###### Returns

Content (`Array<PhrasingContent> | PhrasingContent | string`, optional)

### `Formatter`

How to format a field, in short (TypeScript type).

The values can be:

*   `null` or `undefined` — does nothing;
*   `false` — shortcut for `{exclude: true, label: key}`, can be used to
    exclude default formatters;
*   `true` — shortcut for `{label: key}`, can be used to include default
    formatters (like `email`)
*   `string` — shortcut for `{label: value}`
*   `Formatter` — …or a proper formatter object

###### Type

```ts
type Formatter = FormatterObject | boolean | string | null | undefined
```

### `FormatterObject`

How to format a field (TypeScript type).

###### Fields

*   `exclude` (`boolean`, default: `false`)
    — whether to ignore these fields
*   `format` ([`Format`][api-format], optional)
    — How to format the cell
*   `label` (`string`, optional)
    — text in the header row that labels the column for this field

### `Formatters`

Formatters for fields (TypeScript type).

###### Type

```ts
type Formatters = Record<string, Formatter>
```

### `Options`

Configuration (TypeScript type).

###### Fields

*   `align` ([`AlignType` from `mdast`][mdast-align-type], optional)
    — alignment to use for all cells in the table
*   `appendIfMissing` (`boolean`, default: `false`)
    — inject the section if there is none;
    the default does nothing when the section doesn’t exist so that you have to
    choose where and if the section is added
*   `contributors` ([`Array<Contributor>`][api-contributor], default:
    contributors in `package.json` in Node)
    — list of contributors to inject;
    supports string form (`name <email> (url)`);
    throws if no contributors are found or given
*   `formatters` (`string`, optional)
    — map of fields found in `contributors` to formatters;
    these given formatters extend the [default formatters][file-formatters];
    the keys in `formatters` should correspond directly (case-sensitive) to
    keys in `contributors`
*   `heading` (`RegExp | string`, default: `'contributors'`)
    — heading to look for

## Examples

### Example: passing contributors

The following example shows how contributors can be passed:

```js
import {remark} from 'remark'
import remarkContributors from 'remark-contributors'
import remarkGfm from 'remark-gfm'

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
import remarkContributors from 'remark-contributors'
import remarkGfm from 'remark-gfm'

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
@@ -12,7 +12,16 @@ const file = await remark()
       {name: 'Jane Doe', age: 31, topping: 'Mozzarella'},
       {name: 'John Doe', age: 29, topping: 'Olive'},
       {name: 'Mona Lisa', age: 3, topping: 'Pineapple'}
-    ]
+    ],
+    formatters: {
+      age: {
+        label: 'Age',
+        format(d) {
+          return {type: 'emphasis', children: [{type: 'text', value: String(d)}]}
+        }
+      },
+      topping: 'Topping'
+    }
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

> 👉 **Note**: observe that the labels of `Age` and `Topping` are now cased,
> and that the age values are now wrapped in emphasis.

## Types

This package is fully typed with [TypeScript][].
It exports the additional types
[`Contributor`][api-contributor],
[`ContributorObject`][api-contributor-object],
[`Format`][api-format],
[`Formatter`][api-formatter],
[`FormatterObject`][api-formatter-object],
[`Formatters`][api-formatters], and
[`Options`][api-options].

## Compatibility

Projects maintained by the unified collective are compatible with maintained
versions of Node.js.

When we cut a new major release, we drop support for unmaintained versions of
Node.
This means we try to keep the current release line, `remark-contributors@^6`,
compatible with Node.js 12.

This plugin works with `unified` version 6+ and `remark` version 7+.

## Security

`options.contributors` (or `contributors` in `package.json`) is used and
injected into the tree when given or found.
Data in those lists is formatted by `options.formatters`.
If a user has access to either, this could open you up to a
[cross-site scripting (XSS)][wiki-xss] attack.

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

[size-badge]: https://img.shields.io/bundlejs/size/remark-contributors

[size]: https://bundlejs.com/?q=remark-contributors

[sponsors-badge]: https://opencollective.com/unified/sponsors/badge.svg

[backers-badge]: https://opencollective.com/unified/backers/badge.svg

[collective]: https://opencollective.com/unified

[chat-badge]: https://img.shields.io/badge/chat-discussions-success.svg

[chat]: https://github.com/remarkjs/remark/discussions

[npm]: https://docs.npmjs.com/cli/install

[esm]: https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c

[esmsh]: https://esm.sh

[health]: https://github.com/remarkjs/.github

[contributing]: https://github.com/remarkjs/.github/blob/main/contributing.md

[support]: https://github.com/remarkjs/.github/blob/main/support.md

[coc]: https://github.com/remarkjs/.github/blob/main/code-of-conduct.md

[license]: license

[author]: https://hughsk.io

[hast]: https://github.com/syntax-tree/hast

[mdast-align-type]: https://github.com/syntax-tree#aligntype

[rehype]: https://github.com/rehypejs/rehype

[remark]: https://github.com/remarkjs/remark

[remark-git-contributors]: https://github.com/remarkjs/remark-git-contributors

[typescript]: https://www.typescriptlang.org

[unified]: https://github.com/unifiedjs/unified

[unified-transformer]: https://github.com/unifiedjs/unified#transformer

[wiki-xss]: https://en.wikipedia.org/wiki/Cross-site_scripting

[file-formatters]: lib/formatters.js

[file-package-json]: package.json

[api-contributor]: #contributor

[api-contributor-object]: #contributorobject

[api-format]: #format

[api-formatter]: #formatter

[api-formatter-object]: #formatterobject

[api-formatters]: #formatters

[api-options]: #options

[api-remark-contributors]: #unifieduseremarkcontributors-options
