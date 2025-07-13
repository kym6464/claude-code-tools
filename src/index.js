import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { inspect } from 'node:util'

import spawn from 'nano-spawn'
import RelativeTime from '@yaireo/relative-time'
import { program } from 'commander'
import { select, Separator } from '@inquirer/prompts'

import { readJsonLines, truncate } from './utils.js'

program.option('-d, --debug').action(main).parseAsync()

async function main({ debug }) {
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

  const transcripts = []
  for (const transcriptFile of transcriptFiles) {
    const lines = await readJsonLines(transcriptFile, { limit: 10 })

    if (debug) {
      await select({
        message: `${path.basename(transcriptFile)}`,
        choices: lines.flatMap((line, index) => {
          const { summary, toolUseResult, ...meta } = line
          const { message } = line

          let { role } = message ?? {}

          let description
          let hasToolUse = false
          if (summary) {
            description = summary
          } else if (typeof message.content === 'string') {
            description = message.content
            delete meta.message
          } else if (Array.isArray(message.content)) {
            const descriptionLines = []
            for (const item of message.content) {
              if (item.type === 'text') {
                descriptionLines.push(item.text)
                continue
              }
              if (item.type === 'tool_use') {
                hasToolUse = true
                descriptionLines.push(inspect(item))
              }
            }

            if (descriptionLines.length === message.content.length) {
              delete meta.message
            }

            description = descriptionLines.join('\n')
          }

          if (toolUseResult) {
            description = inspect(toolUseResult)
          }

          let kind
          if (line.isMeta) {
            kind = 'meta'
          } else if (
            ['<bash-input>', '<command-name>'].some((s) =>
              description.startsWith(s),
            )
          ) {
            kind = 'command-input'
          } else if (
            ['<local-command-stdout>', '<bash-stdout>'].some((s) =>
              description.startsWith(s),
            )
          ) {
            kind = 'command-output'
          } else if (toolUseResult) {
            kind = 'tool-result'
          } else if (hasToolUse) {
            kind = 'tool-use'
          }

          return {
            name: index + (role ? ` ${role}` : '') + (kind ? ` ${kind}` : ''),
            description: description + '\n\n' + inspect(meta),
          }
        }),
      })
    }

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

    transcripts.push({
      sessionId: rootNode.sessionId,
      timestamp: rootNode.timestamp,
      summary,
    })
  }

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
