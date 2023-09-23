/**
 * @typedef {import('mdast').PhrasingContent} PhrasingContent
 * @typedef {import('./get-contributors-from-package.js').Contributor} Contributor
 */

/**
 * @callback Format
 *   Format a field.
 * @param {unknown} value
 *   Value of a field in a contributor.
 * @param {string} key
 *   Name of a field in a contributor.
 * @param {Contributor} contributor
 *   Whole contributor.
 * @returns {Array<PhrasingContent> | PhrasingContent | string | null | undefined}
 *   Content.
 *
 * @typedef FormatterObject
 *   How to format a field.
 * @property {boolean | null | undefined} [exclude=false]
 *   Whether to ignore these fields (default: `false`).
 * @property {Format | null | undefined} [format]
 *   How to format the cell (optional).
 * @property {string | null | undefined} [label]
 *   Text in the header row that labels the column for this field (optional).
 *
 * @typedef {Record<string, FormatterObject>} FormatterObjects
 *   Map of fields found in `contributors` to formatter objects.
 */

/** @type {FormatterObjects} */
export const defaultFormatters = {
  email: {exclude: true},
  github: {format: profile, label: 'GitHub'},
  name: {
    format(value) {
      return {type: 'strong', children: [{type: 'text', value: String(value)}]}
    },
    label: 'Name'
  },
  twitter: {format: profile, label: 'Twitter'},
  url: {label: 'Website'}
}

/** @type {Format} */
function profile(raw, key) {
  let value = String(raw)
  let pos = value.toLowerCase().indexOf('.com/')

  // Automatically strip URL's in values from GitHub and Twitter
  // So we can display just the username alone
  if (pos !== -1) {
    value = value.slice(pos + '.com/'.length)
  }

  pos = value.indexOf('/')

  // Strip out the string without trailing slash if it has one
  // so we just get the username back from the value entered
  if (pos !== -1) {
    value = value.slice(0, pos)
  }

  // Remove "@" from the URL's if there are any
  if (value.indexOf('@') === 0) {
    value = value.slice(1)
  }

  // Prevent empty links
  if (!value) {
    // To do: investigate? should return `undefined`?
    return {type: 'text', value: ''}
  }

  return {
    type: 'link',
    url: 'https://' + key + '.com/' + value,
    children: [{type: 'strong', children: [{type: 'text', value: '@' + value}]}]
  }
}
