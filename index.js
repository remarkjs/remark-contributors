const isURL = require('is-url');
const parse = require('parse-author');
const toString = require('mdast-util-to-string');
const path = require('path');
const defaultHeaders = require('./headers');

module.exports = contributorTableAttacher;

function contributorTableAttacher(opts) {
  opts = Object.assign({}, opts);
  opts.contributors = opts.contributors || [];
  let headers;
  let labels;

  if (opts.headers) {
    headers = Object.assign({}, opts.headers);
    labels = [];

    Object.keys(headers).forEach(key => {
      if (headers[key] === true) {
        headers[key] = defaultHeaders[key];
      }

      if (!headers[key].exclude) {
        labels.push(headers[key].label || key);
      };
    })
  } else {
    headers = defaultHeaders;
    labels = null;
  }

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

    // Traverse through all contributors to get all the unique table headers
    let tableHeaders = labels || opts.contributors.reduce((acc, contrib) => {
      Object.keys(contrib).forEach(original => {
        const key = original.toLowerCase();

        if (headers[key] && headers[key].exclude) {
          return;
        }

        if (headers[key] && headers[key].label) {
          original = headers[key].label;
        }

        if (acc.indexOf(original) === -1) {
          acc.push(original);
        }
      });

      return acc;
    }, []);

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

        if (headers[key] && headers[key].exclude) {
          delete contrib[key];
          return;
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
        let child;

        if (headers[key] && headers[key].format) {
          child = headers[key].format(value, contrib, key, file);

          if (!child) {
            child = {type: 'text', value: ''};
          }
        } else if (isURL(value)) {
          child = {type: 'link', url: value, children: [{type: 'text', value}]};
        } else {
          child = {type: 'text', value: value};
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
      align: new Array(tableHeaders.length).fill(opts.align || null),
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
