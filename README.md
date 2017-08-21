# remark-contributors

![](http://img.shields.io/badge/stability-stable-orange.svg?style=flat)
![](http://img.shields.io/npm/v/remark-contributors.svg?style=flat)
![](http://img.shields.io/npm/dm/remark-contributors.svg?style=flat)
![](http://img.shields.io/npm/l/remark-contributors.svg?style=flat)

[remark](https://github.com/wooorm/remark) plugin to inject a given list of contributors into a table in a markdown file.

By default this package searches for the [contributors field](https://docs.npmjs.com/files/package.json#people-fields-author-contributors) in your project's `package.json`.

It will then display a table with Name, Email, and URL.  However you can customize the output to display any headers in a table, such as (but not limited to) Name, GitHub, and Twitter.

Safe to be run on your `README.md` file before each commit without creating unnecessary noise!

## Usage

[![NPM](https://nodei.co/npm/remark-contributors.png)](https://nodei.co/npm/remark-contributors/)

Used as a plugin for remark.

### Input

> Read from `package.json` contributors field:

```js
const plugin = require('remark-contributors')
const remark = require('remark')

readme = remark().use(plugin).processSync(readme);
```

> Read from a custom list of contributors with GitHub and Twitter handles (ignores `package.json`):

```js
const plugin = require('remark-contributors')
const remark = require('remark')

readme = remark().use(plugin, {
  contributors: [
    {
      name: 'Hugh Kennedy',
      twitter: 'hughskennedy',
      github: 'hughsk'
    },
    {
      name: 'Nick Baugh',
      twitter: 'niftylettuce',
      github: 'niftylettuce'
    }
  ]
}).processSync(readme)
```

> Read from a custom list of contributors with Portfolio and YouTube links (ignores `package.json`):

```js
const plugin = require('remark-contributors')
const remark = require('remark')

readme = remark().use(plugin, {
  contributors: [
    {
      name: 'Hugh Kennedy',
      Portfolio: 'https://some-link-to-portfolio.com',
      YouTube: 'https://youtube.com/some-channel'
    }
  ]
}).processSync(readme)
```

### Output

This will add a "Contributors" section to your document if one is not already present. If one is present, a list of contributors will be added to that section.

For example, the following input markdown:

```markdown
# My Readme

Hello World!
```

Would yield:

```markdown
# My Readme

Hello World!

## Contributors

| Name             | GitHub                                               | Twitter                                               |
| ---------------- | ---------------------------------------------------- | ----------------------------------------------------- |
| **Hugh Kennedy** | [**@hughsk**](https://github.com/hughsk)             | [**@hughskennedy**](https://twitter.com/hughskennedy) |
| **Nick Baugh**   | [**@niftylettuce**](https://github.com/niftylettuce) | [**@niftylettuce**](https://twitter.com/niftylettuce) |
```

Any other text in the contributors section will still be preserved, so you can still include appreciative personal gratitude of your choosing.

### Notes

-   If you have custom fields other than `name`, `url`, `github`, or `twitter` you must use proper casing as shown above (e.g. `Dribbble`) when defining your contributors.
-   Fields named `url` will be automatically renamed to `Website` for display purposes (e.g. in `package.json` contributors field).
-   Emails are automatically removed from being displayed
-   If a header name is undefined for a given contributor, then the value will be set to an empty string automatically
-   Header names are displayed in the order they are defined (first defined => first displayed)
-   GitHub and Twitter URL's are automatically stripped and displayed with **@mention** wrapped in an `https://` link

## Options

### `options.contributors`

Optional. If specified it will ignore `package.json`'s contributors field.

An array of contributors, with properties such as:

-   `name`: the preferred name of the contributor.
-   `github`: the GitHub account of the contributor, with or without an `@`.
-   `twitter`: the Twitter account of the contributor, with or without an `@`.

## Contributors

| Name             | GitHub                                              | Twitter                                               |
| ---------------- | --------------------------------------------------- | ----------------------------------------------------- |
| **Hugh Kennedy** | [**@hughsk**](https://github.com/hughsk)             | [**@hughskennedy**](https://twitter.com/hughskennedy) |
| **Titus Wormer** | [**@wooorm**](https://github.com/wooorm)             | [**@wooorm**](https://twitter.com/wooorm)             |
| **Nick Baugh**   | [**@niftylettuce**](https://github.com/niftylettuce) | [**@niftylettuce**](https://twitter.com/niftylettuce) |

## License

MIT. See [LICENSE.md](http://github.com/hughsk/remark-contributors/blob/master/LICENSE.md) for details.
