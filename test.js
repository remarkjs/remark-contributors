const remark = require('remark');
const test = require('tape');
const diff = require('diff');
const plugin = require('./');
const fs = require('fs');

const fixtures = {
  'Adds section if none exists': fs.readFileSync('fixtures/basic.md', 'utf8'),
  'Replaces table if present in section': fs.readFileSync('fixtures/replace-table.md', 'utf8'),
  'Adds table if not present in section': fs.readFileSync('fixtures/add-table.md', 'utf8')
};

const expected = {
  'Adds section if none exists': fs.readFileSync('fixtures/basic-expected.md', 'utf8'),
  'Replaces table if present in section': fs.readFileSync('fixtures/replace-table-expected.md', 'utf8'),
  'Adds table if not present in section': fs.readFileSync('fixtures/add-table-expected.md', 'utf8')
};

const packageFixture = fs.readFileSync('fixtures/package.md', 'utf8');
const packageExpected = fs.readFileSync('fixtures/package-expected.md', 'utf8');

const customFixture = fs.readFileSync('fixtures/custom.md', 'utf8');
const customExpected = fs.readFileSync('fixtures/custom-expected.md', 'utf8');

const partialFixture = fs.readFileSync('fixtures/partial.md', 'utf8');
const partialExpected = fs.readFileSync('fixtures/partial-expected.md', 'utf8');

const formatFixture = fs.readFileSync('fixtures/format.md', 'utf8');
const formatExpected = fs.readFileSync('fixtures/format-expected.md', 'utf8');

test('remark-contributors with package.json contributors field', t => {
  const processor = remark().use(plugin, {
    appendIfMissing: true
  });
  const actual = processor.processSync(packageFixture).toString().trim();
  const expect = packageExpected.trim();
  t.equal(actual, expect, 'Adds section if none exists');
  if (actual !== expect) {
    console.error(diff.diffChars(expect, actual));
  }
  t.end();
});

test('do not add remark-contributors when header is missing', t => {
  const processor = remark().use(plugin);
  const actual = processor.processSync(packageFixture).toString().trim();
  const expect = packageFixture.trim();
  t.equal(actual, expect, 'Do not add section if none exists and options prevent adding');
  if (actual !== expect) {
    console.error(diff.diffChars(expect, actual));
  }
  t.end();
});

test('remark-contributors with custom contributors option headers', t => {
  const processor = remark().use(plugin, {
    contributors: [
      { name: 'Jason', Age: 20, Commits: 99, YouTube: 'https://youtube.com/some-channel', Term: 1 },
      { Commits: 20, name: 'Alex', Term: 2 },
      { name: 'Theo', Commits: 19, Age: 17 }
    ],
    appendIfMissing: true
  });
  const actual = processor.processSync(customFixture).toString().trim();
  const expect = customExpected.trim();
  t.equal(actual, expect, 'Adds section if none exists');
  if (actual !== expect) {
    console.error(diff.diffChars(expect, actual));
  }
  t.end();
});

test('remark-contributors with github/twitter contributors options (with typos)', t => {
  Object.keys(fixtures).forEach(name => {
    const processor = remark().use(plugin, {
      contributors: [
        {name: 'Hugh Kennedy', GITHUB: 'hughsk', twitter: '@hughskennedy'},
        {GithuB: 'https://github.com/timoxley', name: 'Tim Oxley', TWITTER: 'secoif'},
        {Twitter: 'http://twitter.com/@rvagg/', github: 'rvagg', name: 'Rod Vagg' }
      ],
      appendIfMissing: true
    });
    const actual = processor.processSync(fixtures[name]).toString().trim();
    const expect = expected[name].trim();

    t.equal(actual, expect, name);

    if (actual !== expect) {
      console.error(diff.diffChars(expect, actual));
    }
  });

  t.end();
});

test('remark-contributors with partial github/twitter contributors options', t => {
  const processor = remark().use(plugin, {
    contributors: [
      { name: 'Sara', github: 'sara' },
      { name: 'Jason' },
      { name: 'Alice', twitter: 'alice' }
    ]
  });
  const actual = processor.processSync(partialFixture).toString().trim();
  const expect = partialExpected.trim();
  t.equal(actual, expect, 'Skips missing properties');
  if (actual !== expect) {
    console.error(diff.diffChars(expect, actual));
  }
  t.end();
});

test('remark-contributors with custom formatter options', t => {
  const processor = remark().use(plugin, {
    headers: {
      name: true,
      github: true,
      social: {
        label: 'Social',
        format: function(value, contrib) {
          // To simplify this test, don't wrap in links etc.
          if (contrib.twitter) {
            return {type: 'text', value: '@' + contrib.twitter + '@twitter'};
          } else if (contrib.mastodon) {
            return {type: 'text', value: contrib.mastodon};
          }
        }
      }
    },
    contributors: [
      { name: 'Sara', github: 'sara', mastodon: '@sara@domain' },
      { name: 'Jason' },
      { name: 'Alice', twitter: 'alice' }
    ]
  });
  const actual = processor.processSync(formatFixture).toString().trim();
  const expect = formatExpected.trim();
  t.equal(actual, expect, 'Supports custom formatters');
  if (actual !== expect) {
    console.error(diff.diffChars(expect, actual));
  }
  t.end();
});
