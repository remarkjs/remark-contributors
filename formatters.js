'use strict'

var u = require('unist-builder')

var https = 'https://'
var com = '.com/'
var slash = '/'
var at = '@'

exports.email = {
  exclude: true
}

exports.name = {
  label: 'Name',
  format: name
}

exports.url = {
  label: 'Website'
}

exports.github = {
  label: 'GitHub',
  format: profile
}

exports.twitter = {
  label: 'Twitter',
  format: profile
}

function name(value) {
  return u('strong', [u('text', value)])
}

function profile(value, key) {
  var pos = value.toLowerCase().indexOf(com)

  // Automatically strip URL's in values from GitHub and Twitter
  // So we can display just the username alone
  if (pos !== -1) {
    value = value.slice(pos + com.length)
  }

  pos = value.indexOf(slash)

  // Strip out the string without trailing slash if it has one
  // so we just get the username back from the value entered
  if (pos !== -1) {
    value = value.slice(0, pos)
  }

  // Remove "@" from the URL's if there are any
  if (value.indexOf(at) === 0) {
    value = value.slice(1)
  }

  // Prevent empty links
  if (!value) {
    return u('text', '')
  }

  return {
    type: 'link',
    url: https + key + com + value,
    children: [u('strong', [u('text', at + value)])]
  }
}
