/**
 * @typedef {import('mdast').Root} Root
 * @typedef {import('mdast').BlockContent} BlockContent
 * @typedef {import('mdast').TableContent} TableContent
 * @typedef {import('mdast').RowContent} RowContent
 * @typedef {import('mdast').AlignType} AlignType
 * @typedef {import('vfile').VFile} VFile
 * @typedef {import('./get-contributors-from-package.js').ContributorObject} ContributorObject
 * @typedef {import('./get-contributors-from-package.js').Contributor} Contributor
 * @typedef {import('./formatters.js').FormatterObject} FormatterObject
 * @typedef {import('./formatters.js').Format} Format
 * @typedef {import('./formatters.js').FormatterObjects} FormatterObjects
 *
 * @typedef {string|boolean|null|undefined|FormatterObject} Formatter
 * @typedef {Record<string, Formatter>} Formatters
 *
 * @typedef Options
 *   Configuration.
 * @property {Array<Contributor>} [contributors]
 *   List of contributors to inject.
 *   Defaults to the `contributors` field in the closest `package.json` upwards
 *   from the processed file, if there is one.
 *   Supports the string form (`name <email> (url)`) as well.
 *   Fails if no contributors are found or given.
 * @property {AlignType} [align]
 *   Alignment to use for all cells in the table.
 * @property {boolean} [appendIfMissing=false]
 *   Inject the section if there is none.
 * @property {string|RegExp} [heading='contributors']
 *   Heading to look for.
 * @property {Formatters} [formatters=[]]
 *   Map of fields found in `contributors` to formatters.
 *   These given formatters extend the default formatters.
 *
 *   The keys in `formatters` should correspond directly (case-sensitive) to
 *   keys in `contributors`.
 *
 *   The values can be:
 *
 *   *   `null` or `undefined` — does nothing.
 *   *   `false` — shortcut for `{label: key, exclude: true}`, can be used to
 *       exclude default formatters.
 *   *   `true` — shortcut for `{label: key}`, can be used to include default
 *        formatters (like `email`)
 *   *   `string` — shortcut for `{label: value}`
 *   *   `Formatter` — …or a proper formatter object
 */

import isUrl from 'is-url'
import parse from 'parse-author'
import {headingRange} from 'mdast-util-heading-range'
import {u} from 'unist-builder'
import {defaultFormatters} from './formatters.js'
import {getContributorsFromPackage} from './get-contributors-from-package.js'

const own = {}.hasOwnProperty

/**
 * Plugin to inject a given list of contributors into a table.
 *
 * @type {import('unified').Plugin<[Options?] | Array<void>, Root>}
 * @returns {(node: Root, file: VFile) => Promise<void>}
 */
export default function remarkContributors(options = {}) {
  const align = options.align || null
  const defaultContributors = options.contributors
  const formatters = createFormatters(options.formatters)
  const contributorsHeading = options.heading || 'contributors'

  return async (tree, file) => {
    const rawContributors =
      defaultContributors || (await getContributorsFromPackage(file))
    /** @type {Array<ContributorObject>} */
    const contributors = []
    let index = -1

    if (rawContributors) {
      while (++index < rawContributors.length) {
        const value = rawContributors[index]
        // @ts-expect-error: indexable.
        contributors.push(typeof value === 'string' ? parse(value) : value)
      }
    }

    if (contributors.length === 0) {
      throw new Error(
        'Missing required `contributors` in settings.\nEither add `contributors` to `package.json` or pass them into `remark-contributors`'
      )
    }

    const table = createTable(contributors, formatters, align)
    let headingFound = false

    headingRange(tree, contributorsHeading, (start, nodes, end) => {
      let siblings = /** @type {Array<BlockContent>} */ (nodes)
      let index = -1
      let tableFound = false

      headingFound = true

      while (++index < siblings.length) {
        const node = siblings[index]

        if (node.type === 'table') {
          tableFound = true
          siblings = siblings
            .slice(0, index)
            .concat(table, siblings.slice(index + 1))
          break
        }
      }

      if (!tableFound) {
        siblings = [table, ...siblings]
      }

      return [start, ...siblings, end]
    })

    // Add the section if not found but with `appendIfMissing`.
    if (!headingFound && options.appendIfMissing) {
      tree.children.push(
        {type: 'heading', depth: 2, children: [u('text', 'Contributors')]},
        table
      )
    }
  }
}

/**
 * @param {Array<ContributorObject>} contributors
 * @param {FormatterObjects} formatters
 * @param {AlignType} align
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
    cells[cellIndex] = u('tableCell', [u('text', value)])
  }

  rows.push(u('tableRow', cells))

  while (++rowIndex < contributors.length) {
    const contributor = contributors[rowIndex]
    /** @type {Array<RowContent>} */
    const cells = []
    let cellIndex = -1

    while (++cellIndex < keys.length) {
      const key = keys[cellIndex]
      const format =
        (formatters[key] && formatters[key].format) ||
        /** @type {Format} */ ((d) => d)

      let value = format(
        contributor[key] === null || contributor[key] === undefined
          ? ''
          : typeof contributor[key] === 'number'
          ? String(contributor[key])
          : contributor[key],
        key,
        contributor
      )

      if (typeof value === 'string') {
        value = isUrl(value)
          ? u('link', {url: value}, [u('text', value)])
          : u('text', value)
      }

      if (value === null || value === undefined) {
        value = []
      } else if (!Array.isArray(value)) {
        value = [value]
      }

      cells[cellIndex] = u('tableCell', value)
    }

    rows.push(u('tableRow', cells))
  }

  return u('table', {align: aligns}, rows)
}

/**
 * @param {Array<ContributorObject>} contributors
 * @param {FormatterObjects} formatters
 * @returns {Array<string>}
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

/**
 * @param {Formatters|undefined} headers
 * @returns {FormatterObjects}
 */
function createFormatters(headers) {
  const formatters = Object.assign({}, defaultFormatters)

  if (!headers) {
    return formatters
  }

  /** @type {string} */
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
