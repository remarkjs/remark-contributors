import path from 'path'
import isUrl from 'is-url'
import {findUpOne} from 'vfile-find-up'
import {read} from 'to-vfile'
import parse from 'parse-author'
import {headingRange} from 'mdast-util-heading-range'
import {u} from 'unist-builder'
import {defaultFormatters} from './formatters.js'

const own = {}.hasOwnProperty

export default function remarkContributors(options) {
  const settings = options || {}
  const align = settings.align || null
  const defaultContributors = settings.contributors
  const formatters = createFormatters(settings.formatters)
  const contributorsHeading = settings.heading || 'contributors'

  return transform

  function transform(tree, file, next) {
    if (defaultContributors) {
      done(defaultContributors)
    } else if (file.dirname) {
      // `dirname` is always set if there is a path: to `.` or a folder.
      findUpOne('package.json', path.resolve(file.cwd, file.dirname), onfound)
    } else {
      next(
        new Error(
          'Missing required `path` on `file`.\nMake sure it’s defined or pass `contributors` to `remark-contributors`'
        )
      )
    }

    function onfound(error, file) {
      // `find-up` currently never passes errors.
      /* c8 ignore next 3 */
      if (error) {
        next(error)
      } else if (file) {
        read(file, onread)
      } else {
        done([])
      }
    }

    function onread(error, file) {
      let pack

      // Files that are found but cannot be read are hard to test.
      /* c8 ignore next 3 */
      if (error) {
        return next(error)
      }

      try {
        pack = JSON.parse(file)
      } catch (error) {
        return next(error)
      }

      done(pack.contributors)
    }

    function done(values) {
      const contributors = []
      let index = -1

      if (values) {
        while (++index < values.length) {
          const value = values[index]
          contributors.push(typeof value === 'string' ? parse(value) : value)
        }
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
      const table = createTable(contributors, formatters, align)
      let headingFound = false

      headingRange(tree, contributorsHeading, onheading)

      // Add the section if not found but with `appendIfMissing`.
      if (!headingFound && settings.appendIfMissing) {
        tree.children.push(
          u('heading', {depth: 2}, [u('text', 'Contributors')]),
          table
        )
      }

      next()

      function onheading(start, nodes, end) {
        let index = -1
        let tableFound

        headingFound = true

        while (++index < nodes.length) {
          const node = nodes[index]

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
  const keys = createKeys(contributors, formatters)
  const rows = []
  const cells = []
  const aligns = []
  let rowIndex = -1
  let cellIndex = -1

  while (++cellIndex < keys.length) {
    const key = keys[cellIndex]
    const value = (formatters[key] && formatters[key].label) || key
    aligns[cellIndex] = align
    cells[cellIndex] = u('tableCell', [u('text', value)])
  }

  rows.push(u('tableRow', cells))

  while (++rowIndex < contributors.length) {
    const contributor = contributors[rowIndex]
    const cells = []
    let cellIndex = -1

    while (++cellIndex < keys.length) {
      const key = keys[cellIndex]
      const format = (formatters[key] && formatters[key].format) || identity
      let value = contributor[key]

      if (value === null || value === undefined) {
        value = ''
      } else if (typeof value === 'number') {
        value = String(value)
      }

      value = format(value, key, contributor)

      if (typeof value === 'string') {
        value = isUrl(value)
          ? u('link', {url: value}, [u('text', value)])
          : u('text', value)
      }

      if (value === null || value === undefined) {
        value = []
      } else if (typeof value.length !== 'number') {
        value = [value]
      }

      cells[cellIndex] = u('tableCell', value)
    }

    rows.push(u('tableRow', cells))
  }

  return u('table', {align: aligns}, rows)
}

function createKeys(contributors, formatters) {
  const length = contributors.length
  let index = -1
  const labels = []

  while (++index < length) {
    const contributor = contributors[index]
    let field

    for (field in contributor) {
      if (own.call(contributor, field)) {
        const formatter = formatters[field.toLowerCase()]

        if (formatter && formatter.exclude) {
          continue
        }

        if (!labels.includes(field)) {
          labels.push(field)
        }
      }
    }
  }

  return labels
}

function createFormatters(headers) {
  const formatters = Object.assign({}, defaultFormatters)

  if (!headers) {
    return formatters
  }

  let key

  for (key in headers) {
    if (own.call(headers, key)) {
      let formatter = headers[key]

      if (typeof formatter === 'string') {
        formatter = {label: formatter}
      } else if (typeof formatter === 'boolean') {
        formatter = {label: key, exclude: !formatter}
      } else if (formatter === null || typeof formatter !== 'object') {
        continue
      }

      formatters[key] = formatter
    }
  }

  return formatters
}

function identity(value) {
  return value
}
