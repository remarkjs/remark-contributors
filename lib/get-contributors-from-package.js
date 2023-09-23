/**
 * @typedef {import('type-fest').PackageJson} PackageJson
 * @typedef {import('vfile').VFile} VFile
 */

/**
 * @typedef {ContributorObject | string} Contributor
 *   Contributor in string form (`name <email> (url)`) or as object.
 *
 * @typedef {Record<string, unknown>} ContributorObject
 *   Contributor with fields.
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import {findUp} from 'vfile-find-up'

/**
 * Get `contributors` from the `package.json` closest to a file.
 *
 * @param {VFile} file
 *   File.
 * @returns {Promise<ReadonlyArray<Contributor> | undefined>}
 *   Contributors.
 */
export async function getContributorsFromPackage(file) {
  if (file.dirname) {
    // `dirname` is always set if there is a path: to `.` or a folder.
    const packageFile = await findUp(
      'package.json',
      path.resolve(file.cwd, file.dirname)
    )

    if (packageFile) {
      packageFile.value = await fs.readFile(packageFile.path)
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
