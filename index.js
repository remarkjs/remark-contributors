'use strict'

var fs = require('fs')
var path = require('path')
var isURL = require('is-url')
var parse = require('parse-author')
var heading = require('mdast-util-heading-range')
var u = require('unist-builder')
var defaultFormatters = require('./formatters')

module.exports = contributors

function contributors(opts) {
  var settings = opts || {}
  var align = settings.align || null
  var defaultContributors = settings.contributors
  var formatters = createFormatters(settings.formatters)

  return transform

  function transform(tree, file, next) {
    if (defaultContributors) {
      done(defaultContributors)
    } else {
      fs.readFile(path.resolve(file.cwd, 'package.json'), onpackage)
    }

    function onpackage(err, buf) {
      var pack = {}

      if (buf) {
        try {
          pack = JSON.parse(buf)
        } catch (error) {
          return next(error)
        }
      }

      /* istanbul ignore if - hard to test. */
      if (err && err.code !== 'ENOENT') {
        next(err)
      } else {
        done(pack.contributors)
      }
    }

    function done(values) {
      var contributors = []
      var length = values && values.length
      var index = -1
      var value

      while (++index < length) {
        value = values[index]
        contributors.push(typeof value === 'string' ? parse(value) : value)
      }

      if (contributors.length === 0) {
        next(
          new Error(
            'Missing required `contributors` in settings.\nEither add `contributors` to `package.json` or pass them into `remark-contributors`'
          )
        )
      } else {
        oncontributors(contributors)
      }
    }

    function oncontributors(contributors) {
      var table = createTable(contributors, formatters, align)
      var headingFound = false

      heading(tree, 'contributors', onheading)

      // Add the section if not found but with `appendIfMissing`.
      if (!headingFound && settings.appendIfMissing) {
        tree.children.push(
          u('heading', {depth: 2}, [u('text', 'Contributors')]),
          table
        )
      }

      next()

      function onheading(start, nodes, end) {
        var length = nodes.length
        var index = -1
        var node
        var tableFound

        headingFound = true

        while (++index < length) {
          node = nodes[index]

          if (node.type === 'table') {
            tableFound = true
            nodes = nodes.slice(0, index).concat(table, nodes.slice(index + 1))
            break
          }
        }

        if (!tableFound) {
          nodes = [table].concat(nodes)
        }

        return [start].concat(nodes, end)
      }
    }
  }
}

function createTable(contributors, formatters, align) {
  var keys = createKeys(contributors, formatters)
  var length = contributors.length
  var count = keys.length
  var index = -1
  var rows = []
  var offset = -1
  var contributor
  var key
  var cells = []
  var aligns = []
  var value
  var format

  while (++offset < count) {
    key = keys[offset]
    value = (formatters[key] && formatters[key].label) || key

    aligns[offset] = align
    cells[offset] = u('tableCell', [u('text', value)])
  }

  rows.push(u('tableRow', cells))

  while (++index < length) {
    contributor = contributors[index]
    offset = -1
    cells = []

    while (++offset < count) {
      key = keys[offset]
      format = (formatters[key] && formatters[key].format) || identity
      value = contributor[key]

      if (value === null || value === undefined) {
        value = ''
      } else if (typeof value === 'number') {
        value = String(value)
      }

      value = format(value, key, contributor)

      if (typeof value === 'string') {
        if (isURL(value)) {
          value = u('link', {url: value}, [u('text', value)])
        } else {
          value = u('text', value)
        }
      }

      if (value === null || value === undefined) {
        value = []
      } else if (typeof value.length !== 'number') {
        value = [value]
      }

      cells[offset] = u('tableCell', value)
    }

    rows.push(u('tableRow', cells))
  }

  return u('table', {align: aligns}, rows)
}

function createKeys(contributors, formatters) {
  var length = contributors.length
  var index = -1
  var labels = []
  var contributor
  var field
  var formatter

  while (++index < length) {
    contributor = contributors[index]

    for (field in contributor) {
      formatter = formatters[field.toLowerCase()]

      if (formatter && formatter.exclude) {
        continue
      }

      if (labels.indexOf(field) === -1) {
        labels.push(field)
      }
    }
  }

  return labels
}

function createFormatters(headers) {
  var formatters = Object.assign({}, defaultFormatters)
  var key
  var formatter

  if (!headers) {
    return formatters
  }

  for (key in headers) {
    formatter = headers[key]

    if (typeof formatter === 'string') {
      formatter = {label: formatter}
    } else if (typeof formatter === 'boolean') {
      formatter = {label: key, exclude: !formatter}
    } else if (formatter === null || typeof formatter !== 'object') {
      continue
    }

    formatters[key] = formatter
  }

  return formatters
}

function identity(value) {
  return value
}
