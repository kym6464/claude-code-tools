import fs from 'node:fs'
import readline from 'node:readline/promises'

/**
 * Read a file by streaming line by line. Useful for very large files
 * @param {string} fpath File path
 * @param {function(string): void} onLine
 * @param {object} options
 * @param {number?} options.limit Max number of records to read
 * @returns {Promise<null>} Resolves when all lines are read
 */
export async function readLines(fpath, onLine, { limit } = {}) {
  const fileStream = fs.createReadStream(fpath, { encoding: 'utf-8' })
  const rl = readline.createInterface({ input: fileStream })
  let lineCount = 0
  rl.on('line', (line) => {
    if (limit && lineCount >= limit) {
      return
    }
    onLine(line)
    lineCount += 1
    if (limit && lineCount >= limit) {
      rl.close()
    }
  })
  return new Promise((resolve) => rl.on('close', () => resolve()))
}

/**
 * Read a JSON lines file
 * @param {string} fpath path/to/file.jsonl
 * @param {object} options
 * @param {number?} options.limit Max number of records to read
 * @returns {Promise<{[key: string]: any}[]>}
 */
export async function readJsonLines(fpath, { limit } = {}) {
  const records = []
  await readLines(fpath, (line) => records.push(JSON.parse(line)), { limit })
  return records
}

/**
 * Truncate a string to a specified length
 * @param {string} str String to truncate
 * @param {object} options
 * @param {number} options.maxLength Maximum length
 * @param {string} options.suffix Suffix to append when truncated
 * @returns {string} Truncated string
 */
export function truncate(str, { maxLength, suffix = '...' } = {}) {
  if (str.length <= maxLength) {
    return str
  }
  return str.slice(0, maxLength - suffix.length) + suffix
}
