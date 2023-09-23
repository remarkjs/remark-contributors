/**
 * @typedef {import('mdast').AlignType} AlignType
 * @typedef {import('mdast').BlockContent} BlockContent
 * @typedef {import('mdast').Root} Root
 * @typedef {import('mdast').RowContent} RowContent
 * @typedef {import('mdast').Table} Table
 * @typedef {import('mdast').TableContent} TableContent
 *
 * @typedef {import('vfile').VFile} VFile
 *
 * @typedef {import('./formatters.js').Format} Format
 * @typedef {import('./formatters.js').FormatterObject} FormatterObject
 * @typedef {import('./formatters.js').FormatterObjects} FormatterObjects
 *
 * @typedef {import('./get-contributors-from-package.js').Contributor} Contributor
 * @typedef {import('./get-contributors-from-package.js').ContributorObject} ContributorObject
 */

/**
 * @typedef {FormatterObject | boolean | string | null | undefined} Formatter
 *   Formatter.
 *
 * @typedef {Record<string, Formatter>} Formatters
 *   Formatters.
 *
 * @typedef Options
 *   Configuration.
 * @property {AlignType | undefined} [align]
 *   Alignment to use for all cells in the table (optional).
 * @property {boolean | null | undefined} [appendIfMissing=false]
 *   Inject the section if there is none (default: `false`).
 * @property {ReadonlyArray<Contributor> | null | undefined} [contributors]
 *   List of contributors to inject (default: contributors in `package.json`
 *   in Node).
 *   Supports string form (`name <email> (url)`).
 *   Throws if no contributors are found or given.
 * @property {Readonly<Formatters> | null | undefined} [formatters]
 *   Map of fields found in `contributors` to formatters (optional).
 *   These given formatters extend the default formatters.
 *
 *   The keys in `formatters` should correspond directly (case-sensitive) to
 *   keys in `contributors`.
 *
 *   The values can be:
 *
 *   *   `null` or `undefined` — does nothing;
 *   *   `false` — shortcut for `{exclude: true, label: key}`, can be used to
 *       exclude default formatters;
 *   *   `true` — shortcut for `{label: key}`, can be used to include default
 *        formatters (like `email`)
 *   *   `string` — shortcut for `{label: value}`
 *   *   `Formatter` — …or a proper formatter object
 * @property {RegExp | string | null | undefined} [heading='contributors']
 *   Heading to look for (default: `'contributors'`).
 */

import isUrl from 'is-url'
import {headingRange} from 'mdast-util-heading-range'
import parseAuthor from 'parse-author'
import {defaultFormatters} from './formatters.js'
import {getContributorsFromPackage} from './get-contributors-from-package.js'

/** @type {Readonly<Options>} */
const emptyOptions = {}

/**
 * Add a list of contributors.
 *
 * @param {Readonly<Options> | null | undefined} [options]
 *   Configuration (optional).
 * @returns
 *   Transform.
 */
export default function remarkContributors(options) {
  const settings = options || emptyOptions
  const align = settings.align || null
  const contributorsHeading = settings.heading || 'contributors'
  const defaultContributors = settings.contributors
  const formatters = createFormatters(settings.formatters || {})

  /**
   * Transform.
   *
   * @param {Root} tree
   *   Tree.
   * @param {VFile} file
   *   File.
   * @returns {Promise<undefined>}
   *   Nothing.
   */
  return async function (tree, file) {
    const rawContributors =
      defaultContributors || (await getContributorsFromPackage(file))
    /** @type {Array<ContributorObject>} */
    const contributors = []
    let index = -1

    if (rawContributors) {
      while (++index < rawContributors.length) {
        const value = rawContributors[index]
        contributors.push(
          // @ts-expect-error: indexable.
          typeof value === 'string' ? parseAuthor(value) : value
        )
      }
    }

    if (contributors.length === 0) {
      throw new Error(
        'Missing required `contributors` in settings.\nEither add `contributors` to `package.json` or pass them into `remark-contributors`'
      )
    }

    let headingFound = false

    headingRange(tree, contributorsHeading, function (start, siblings, end) {
      let index = -1

      while (++index < siblings.length) {
        if (siblings[index].type === 'table') {
          break
        }
      }

      headingFound = true

      const table = createTable(contributors, formatters, align)

      return index === siblings.length
        ? [start, table, ...siblings, end]
        : [
            start,
            ...siblings.slice(0, index),
            table,
            ...siblings.slice(index + 1),
            end
          ]
    })

    // Add the section if not found but with `appendIfMissing`.
    if (!headingFound && settings.appendIfMissing) {
      tree.children.push(
        {
          type: 'heading',
          depth: 2,
          children: [{type: 'text', value: 'Contributors'}]
        },
        createTable(contributors, formatters, align)
      )
    }
  }
}

/**
 * @param {ReadonlyArray<ContributorObject>} contributors
 *   Contributors.
 * @param {Readonly<FormatterObjects>} formatters
 *   Formatters.
 * @param {AlignType} align
 *   Alignment.
 * @returns {Table}
 *   Table.
 */
function createTable(contributors, formatters, align) {
  const keys = createKeys(contributors, formatters)
  /** @type {Array<TableContent>} */
  const rows = []
  /** @type {Array<RowContent>} */
  const cells = []
  /** @type {Array<AlignType>} */
  const aligns = []
  let rowIndex = -1
  let cellIndex = -1

  while (++cellIndex < keys.length) {
    const key = keys[cellIndex]
    const value = (formatters[key] && formatters[key].label) || key
    aligns[cellIndex] = align
    cells[cellIndex] = {
      type: 'tableCell',
      children: [{type: 'text', value}]
    }
  }

  rows.push({type: 'tableRow', children: cells})

  while (++rowIndex < contributors.length) {
    const contributor = contributors[rowIndex]
    /** @type {Array<RowContent>} */
    const cells = []
    let cellIndex = -1

    while (++cellIndex < keys.length) {
      const key = keys[cellIndex]
      const format = (formatters[key] && formatters[key].format) || identity

      const value = format(
        contributor[key] === null || contributor[key] === undefined
          ? ''
          : typeof contributor[key] === 'number'
          ? String(contributor[key])
          : contributor[key],
        key,
        contributor
      )

      cells[cellIndex] = {
        type: 'tableCell',
        children:
          value === null || value === undefined
            ? []
            : Array.isArray(value)
            ? value
            : typeof value === 'string'
            ? isUrl(value)
              ? [{type: 'link', url: value, children: [{type: 'text', value}]}]
              : [{type: 'text', value}]
            : [value]
      }
    }

    rows.push({type: 'tableRow', children: cells})
  }

  return {type: 'table', align: aligns, children: rows}
}

/**
 * @param {ReadonlyArray<ContributorObject>} contributors
 *   Contributors.
 * @param {Readonly<FormatterObjects>} formatters
 *   Formatters.
 * @returns {Array<string>}
 *   Keys.
 */
function createKeys(contributors, formatters) {
  /** @type {Array<string>} */
  const labels = []
  let index = -1

  while (++index < contributors.length) {
    const contributor = contributors[index]
    /** @type {string} */
    let field

    for (field in contributor) {
      if (Object.hasOwn(contributor, field)) {
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

/**
 * @param {Readonly<Formatters>} headers
 *   Headers.
 * @returns {Readonly<FormatterObjects>}
 *   Formatters.
 */
function createFormatters(headers) {
  const formatters = {...defaultFormatters}

  /** @type {string} */
  let key

  for (key in headers) {
    if (Object.hasOwn(headers, key)) {
      let formatter = headers[key]

      if (typeof formatter === 'string') {
        formatter = {label: formatter}
      } else if (typeof formatter === 'boolean') {
        formatter = {exclude: !formatter, label: key}
      } else if (formatter === null || typeof formatter !== 'object') {
        continue
      }

      formatters[key] = formatter
    }
  }

  return formatters
}

/**
 * @template T
 *   Kind.
 * @param {T} d
 *   Thing.
 * @returns {T}
 *   Same.
 */
function identity(d) {
  return d
}
