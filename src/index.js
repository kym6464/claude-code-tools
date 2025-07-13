import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

import spawn from 'nano-spawn'
import RelativeTime from '@yaireo/relative-time'
import { program } from 'commander'
import { select } from '@inquirer/prompts'

import { readJsonLines, truncate } from './utils.js'

program.action(main).parseAsync()

async function main() {
  const { stdout: rootDir } = await spawn('git rev-parse --show-toplevel', {
    shell: true,
  })
  if (!fs.existsSync(rootDir)) {
    program.error('Failed to determine git root directory')
  }

  const projectName = rootDir.replaceAll('/', '-')
  const projectDir = path.resolve(os.homedir(), '.claude/projects', projectName)
  if (!fs.existsSync(projectDir)) {
    program.error(`Failed to find Claude Code project directory ${projectDir}`)
  }

  const transcriptFiles = fs
    .readdirSync(projectDir)
    .filter((s) => s.endsWith('.jsonl'))
    .map((s) => path.join(projectDir, s))

  const transcripts = await Promise.all(
    transcriptFiles.map(async (transcriptFile) => {
      const lines = await readJsonLines(transcriptFile, { limit: 2 })

      /** @type {string} */
      let summary
      /** @type {{timestamp: string, sessionId: string}} */
      let rootNode
      if (lines[0].type === 'summary') {
        summary = lines[0].summary
        rootNode = lines[1]
      } else {
        summary = lines[0].message.content
        rootNode = lines[0]
      }

      return {
        sessionId: rootNode.sessionId,
        timestamp: rootNode.timestamp,
        summary,
      }
    }),
  )

  transcripts.sort((a, b) => b.timestamp.localeCompare(a.timestamp))

  const relativeTime = new RelativeTime()
  const transcript = await select({
    message: 'Select a conversation to export',
    choices: transcripts.map((transcript) => {
      const timestamp =
        ' (' + relativeTime.from(new Date(transcript.timestamp)) + ')'
      const name =
        truncate(transcript.summary, { maxLength: 80 - timestamp.length }) +
        timestamp
      return {
        name: truncate(name, { maxLength: 80 }),
        value: transcript.sessionId,
        description: transcript.summary,
      }
    }),
  })
  console.log(transcript)
}
