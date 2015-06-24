module.exports = contributorTableAttacher

function contributorTableAttacher (mdast, opts) {
  return function contributorTableTransformer (root, file) {
    var heading  = getHeadingIndex(root.children)
    var children = root.children

    var title = {
      type: 'heading',
      depth: 2,
      children: [
        { type: 'text', value: 'Contributors' }
      ]
    }

    var tableHead = {
      type: 'tableHeader',
      children: [
        'Name',
        'GitHub',
        'Twitter'
      ].map(function(label) {
        return {
          type: 'tableCell',
          children: [
            { type: 'text', value: label }
          ]
        }
      })
    }

    var tableRows = opts.contributors.map(function (contrib) {
      if (contrib.twitter.indexOf('@')) {
        contrib.twitter = '@' + contrib.twitter
      }

      var children = [
        {
          type: 'strong',
          value: contrib.name
        },
        {
          type: 'link',
          href: 'https://github.com/' + contrib.github,
          value: contrib.github
        },
        {
          type: 'link',
          href: 'https://twitter.com/' + contrib.twitter.replace(/^\@/g, ''),
          value: contrib.twitter
        }
      ].map(function(child) {
        child.children = [
          { type: 'text', value: child.value }
        ]

        delete child.value

        return {
          type: 'tableCell',
          children: [child]
        }
      })

      return {
        type: 'tableRow',
        children: children
      }
    })

    var table = {
      type: 'table',
      children: [tableHead].concat(tableRows)
    }

    // If no heading was found, add the contributors
    // section to the end of the README file.
    if (heading === null) {
      root.children = root.children.concat([title, table])
      return
    }

    // Otherwise, try and replace the first table in the
    // contributors section with the newly generated one.
    for (var j = heading + 1; j < children.length; j++) {
      var child = children[j]
      if (child.type === 'heading') break
      if (child.type !== 'table') continue
      children[j] = table
      return
    }

    // If a table wasn't found, insert it at the
    // beginning of the contributors section.
    children.splice(heading + 1, 0, table)
  }

  //
  // Tries to find the first "contributors" heading
  // in the README. If one isn't found, will simply
  // return `null`.
  //
  function getHeadingIndex (children) {
    for (var i = 0; i < children.length; i++) {
      if (children[i].type !== 'heading') continue

      var text = mdast.stringify({
        children: children[i].children,
        type: 'root'
      }).toLowerCase()
        .replace(/[^a-z ]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()

      if (text === 'contributors') {
        return i
      }
    }

    return null
  }
}
