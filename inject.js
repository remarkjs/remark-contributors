// Uses itself to update the readme's contributors list.
// Please add yourself here if sending through a Pull Request :)

const mdast  = require('mdast')
const fs     = require('fs')
const plugin = require('./')

fs.writeFileSync('README.md', mdast.use(plugin, {
  contributors: [
    { name: 'Hugh Kennedy', github: 'hughsk', twitter: 'hughskennedy' }
  ]
}).process(
  fs.readFileSync('README.md', 'utf8')
))
