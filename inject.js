// Uses itself to update the readme's contributors list.
// Please add yourself here if sending through a Pull Request :)

const remark  = require('remark')
const fs     = require('fs')
const plugin = require('./')

fs.writeFileSync('README.md', remark().use(plugin, {
  contributors: [
    { name: 'Hugh Kennedy', github: 'hughsk', twitter: 'hughskennedy' },
    { name: 'Titus Wormer', github: 'wooorm', twitter: 'wooorm' },
    { name: 'Nick Baugh', github: 'niftylettuce', twitter: 'niftylettuce' },
    { name: 'Vincent Weevers', github: 'vweevers', twitter: 'vweevers' }
  ]
}).processSync(
  fs.readFileSync('README.md', 'utf8')
))
