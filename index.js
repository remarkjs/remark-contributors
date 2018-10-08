const isURL = require('is-url');
const parse = require('parse-author');
const toString = require('mdast-util-to-string');
const path = require('path');

module.exports = contributorTableAttacher;

function contributorTableAttacher(opts) {
  opts = opts || {};
  opts.contributors = opts.contributors || [];
  if (typeof opts.appendIfMissing === "undefined") {
    opts.appendIfMissing = false
  };

  return function contributorTableTransformer(root, file) {
    const heading = getHeadingIndex(root.children);
    if (!heading && !opts.appendIfMissing) {
      return;
    }
    const children = root.children;
    let pack = {};

    try {
      pack = require(path.resolve(file.cwd, 'package.json'));
    } catch (err) {}

    const title = {
      type: 'heading',
      depth: 2,
      children: [
        {type: 'text', value: 'Contributors'}
      ]
    };

    // Fallback to "contributors" defined in package.json if it exists
    if (opts.contributors.length === 0 && pack.contributors) {
      // Convert "contributors" in package.json to an array of objects
      // each with `name`, `email`, and `url` if available
      opts.contributors = pack.contributors.map(contrib => {
        if (typeof contrib === 'string') {
          contrib = parse(contrib);
        }
        return contrib;
      });
    }

    if (opts.contributors.length === 0) {
      return;
    }

    let tableHeaders = [];

    // Traverse through all contributors to get all the unique table headers
    opts.contributors.forEach(contrib => {
      Object.keys(contrib).forEach(original => {
        const key = original.toLowerCase();

        // Exclude email
        if (key === 'email') {
          return;
        }

        // Name => Name
        if (key === 'name') {
          original = 'Name';
        }

        // Url => Website
        if (key === 'url') {
          original = 'Website';
        }

        // Github => GitHub
        if (key === 'github') {
          original = 'GitHub';
        }

        // Twitter => Twitter
        if (key === 'twitter') {
          original = 'Twitter';
        }

        if (tableHeaders.indexOf(original) === -1) {
          tableHeaders.push(original);
        }
      });
    });

    // Format contributor field names properly and lowercased
    opts.contributors = opts.contributors.map(contrib => {
      Object.keys(contrib).forEach(key => {
        // Store the value of the key
        const value = contrib[key];

        // Convert all keys to lowercase
        if (key !== key.toLowerCase()) {
          delete contrib[key];
          key = key.toLowerCase();
          contrib[key] = value;
        }

        // Never include an email in the table
        if (key === 'email') {
          delete contrib[key];
        }

        // Ensure that url => website
        if (key === 'url') {
          delete contrib[key];
          contrib.website = value;
        }

        // Convert numbers to strings
        if (typeof value === 'number') {
          contrib[key] = value.toString();
        }
      });
      return contrib;
    });

    // Ensure that Name is always the first table header
    const nameIndex = tableHeaders.indexOf('Name');
    if (nameIndex !== -1 && nameIndex !== 0) {
      delete tableHeaders[nameIndex];
      tableHeaders = ['Name'].concat(tableHeaders);
    }

    const tableHead = {
      type: 'tableHeader',
      children: tableHeaders.map(label => {
        return {
          type: 'tableCell',
          children: [
            {type: 'text', value: label}
          ]
        };
      })
    };

    const tableRows = opts.contributors.map(contrib => {
      // Go through each header in the tableHeaders
      // and then add them, in order, respective to contributor
      const children = tableHeaders.map(header => {
        // Convert to lowercase for contributor fields
        key = header.toLowerCase();

        let value = contrib[key] || '';

        const child = {type: key === 'name' ? 'strong' : 'text'};

        if (key === 'github' || key === 'twitter') {
          // Automatically strip URL's in values from GitHub and Twitter
          // So we can display just the username alone
          const com = '.com/';
          if (value.toLowerCase().indexOf(com) !== -1) {
            value = value.substring(value.indexOf(com) + com.length);
          }

          // Strip out the string without trailing slash if it has one
          // so we just get the username back from the value entered
          if (value.indexOf('/') !== -1) {
            value = value.substring(0, value.indexOf('/'));
          }

          // Remove "@" from the URL's if there are any
          if (value.indexOf('@') === 0) {
            value = value.substring(1);
          }

          // Ensure https link is used and properly formatted username
          child.type = 'link';
          child.url = 'https://' + key + '.com/' + value;

          // Add the "@" prefix to username
          value = '@' + value;

          // TODO: Should we add title here?
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
          ];
        } else if (isURL(value)) {
          child.type = 'link';
          child.url = value;
          child.children = [{type: 'text', value}];
        } else if (child.type === 'strong') {
          child.children = [{type: 'text', value}];
        } else {
          child.value = value;
        }

        // Return a table cell
        return {type: 'tableCell', children: [child]};
      });

      return {
        type: 'tableRow',
        children
      };
    });

    const table = {
      type: 'table',
      children: [tableHead].concat(tableRows)
    };

    // If no heading was found, add the contributors
    // section to the end of the README file.
    if (heading === null) {
      root.children = root.children.concat([title, table]);
      return;
    }

    // Otherwise, try and replace the first table in the
    // contributors section with the newly generated one.
    for (let j = heading + 1; j < children.length; j++) {
      const child = children[j];
      if (child.type === 'heading') {
        break;
      }
      if (child.type !== 'table') {
        continue;
      }
      children[j] = table;
      return;
    }

    // If a table wasn't found, insert it at the
    // beginning of the contributors section.
    children.splice(heading + 1, 0, table);
  };

  //
  // Tries to find the first "contributors" heading
  // in the README. If one isn't found, will simply
  // return `null`.
  //
  function getHeadingIndex(children) {
    for (let i = 0; i < children.length; i++) {
      if (children[i].type !== 'heading') {
        continue;
      }

      const text = toString(children[i])
        .toLowerCase()
        .replace(/[^a-z ]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (text === 'contributors') {
        return i;
      }
    }

    return null;
  }
}
