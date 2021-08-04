/**
 * @typedef {import('./index.js').FormatterObjects} FormatterObjects
 * @typedef {import('./index.js').Format} Format
 */

import {u} from 'unist-builder'

/** @type {FormatterObjects} */
export const defaultFormatters = {
  email: {exclude: true},
  name: {
    label: 'Name',
    format(value) {
      return u('strong', [u('text', String(value))])
    }
  },
  url: {label: 'Website'},
  github: {label: 'GitHub', format: profile},
  twitter: {label: 'Twitter', format: profile}
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
    return u('text', '')
  }

  return {
    type: 'link',
    url: 'https://' + key + '.com/' + value,
    children: [u('strong', [u('text', '@' + value)])]
  }
}
