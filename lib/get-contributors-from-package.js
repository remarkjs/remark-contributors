/**
 * @typedef {import('vfile').VFile} VFile
 * @typedef {Record<string, unknown>} ContributorObject
 * @typedef {ContributorObject|string} Contributor
 * @typedef {import('type-fest').PackageJson} PackageJson
 */

import path from 'node:path'
import {findUpOne} from 'vfile-find-up'
import {read} from 'to-vfile'

/**
 * Get `contributors` from the `package.json` closest to a file.
 *
 * @param {VFile} file
 * @returns {Promise<Array<Contributor>|undefined>}
 */
export async function getContributorsFromPackage(file) {
  if (file.dirname) {
    // `dirname` is always set if there is a path: to `.` or a folder.
    const packageFile = await findUpOne(
      'package.json',
      path.resolve(file.cwd, file.dirname)
    )

    if (packageFile) {
      await read(packageFile)
      /** @type {PackageJson} */
      const pack = JSON.parse(String(packageFile))
      return pack.contributors
    }
  } else {
    throw new Error(
      'Missing required `path` on `file`.\nMake sure it’s defined or pass `contributors` to `remark-contributors`'
    )
  }
}
