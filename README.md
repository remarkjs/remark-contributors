# remark-contributors

![](http://img.shields.io/badge/stability-stable-orange.svg?style=flat)
![](http://img.shields.io/npm/v/remark-contributors.svg?style=flat)
![](http://img.shields.io/npm/dm/remark-contributors.svg?style=flat)
![](http://img.shields.io/npm/l/remark-contributors.svg?style=flat)

[remark](https://github.com/wooorm/remark) plugin to inject a given list of contributors
into a table in a markdown file.

Safe to be run on your `README.md` file before each commit
without creating unnecessary noise!

## Usage

[![NPM](https://nodei.co/npm/remark-contributors.png)](https://nodei.co/npm/remark-contributors/)

Used as a plugin for remark like so:

```javascript
const plugin = require('remark-contributors')
const remark  = require('remark')

readme = remark().use(plugin, {
  contributors: [
    {
      name: 'Hugh Kennedy',
      twitter: 'hughskennedy',
      github: 'hughsk'
    }
  ]
}).processSync(readme)
```

This will add a "Contributors" section to your document if
one is not already present. If one is present, a list of
contributors will be added to that section.

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

| Name             | GitHub                              | Twitter                                           |
| ---------------- | ----------------------------------- | ------------------------------------------------- |
| **Hugh Kennedy** | [hughsk](https://github.com/hughsk) | [@hughskennedy](https://twitter.com/hughskennedy) |
```

Any other text in the contributors section will still be
preserved, so you can still include appreciative personal
gratitude of your choosing.

### `options.contributors`

Required. An array of contributors, each with the following
properties:

-   `name`: the preferred name of the contributor.
-   `github`: the GitHub account of the contributor.
-   `twitter`: the Twitter account of the contributor, with or without an `@`.

## License

MIT. See [LICENSE.md](http://github.com/hughsk/remark-contributors/blob/master/LICENSE.md) for details.

## Contributors

| Name             | GitHub                              | Twitter                                           |
| ---------------- | ----------------------------------- | ------------------------------------------------- |
| **Hugh Kennedy** | [hughsk](https://github.com/hughsk) | [@hughskennedy](https://twitter.com/hughskennedy) |
| **Titus Wormer** | [wooorm](https://github.com/wooorm) | [@wooorm](https://twitter.com/wooorm)             |
