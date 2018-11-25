'use strict'

exports.email = {
  exclude: true
}

exports.name = {
  label: 'Name',
  format: function(value) {
    return {type: 'strong', children: [{type: 'text', value}]}
  }
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

function profile(value, key) {
  const child = {type: 'text'}

  // Automatically strip URL's in values from GitHub and Twitter
  // So we can display just the username alone
  const com = '.com/'
  if (value.toLowerCase().indexOf(com) !== -1) {
    value = value.substring(value.indexOf(com) + com.length)
  }

  // Strip out the string without trailing slash if it has one
  // so we just get the username back from the value entered
  if (value.indexOf('/') !== -1) {
    value = value.substring(0, value.indexOf('/'))
  }

  // Remove "@" from the URL's if there are any
  if (value.indexOf('@') === 0) {
    value = value.substring(1)
  }

  // Prevent empty links
  if (value === '') {
    child.value = ''
    return child
  }

  // Ensure https link is used and properly formatted username
  child.type = 'link'
  child.url = 'https://' + key + '.com/' + value

  // Add the "@" prefix to username
  value = '@' + value

  // To do: Should we add title here?
  // Add title
  // child.title = 'View ' + value + ' on ' + header;

  child.children = [
    {
      // Set the @mention to bold just like GitHub/Twitter do
      // Note that this package also puts in bold the @mentions
      // <https://github.com/wooorm/remark-github>
      type: 'strong',
      children: [{type: 'text', value}]
    }
  ]

  return child
}
