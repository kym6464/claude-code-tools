import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { inspect } from 'node:util'

import spawn from 'nano-spawn'
import RelativeTime from '@yaireo/relative-time'
import { program } from 'commander'
import { select } from '@inquirer/prompts'
import { XMLParser, XMLValidator } from 'fast-xml-parser'

import { readJsonLines, truncate } from './utils.js'

process.on('uncaughtException', (error) => {
  if (error instanceof Error && error.name === 'ExitPromptError') {
    return
  }
  throw error
})

const xmlParser = new XMLParser()

program
  .option(
    '-d, --debug [sessionId]',
    'Step through each line in each file. Optionally pass a session id to focus on that specific file.',
  )
  .action(main)
  .parseAsync()

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

  let transcriptFiles = fs
    .readdirSync(projectDir)
    .filter((s) => s.endsWith('.jsonl'))
    .map((s) => path.join(projectDir, s))

  if (debug && typeof debug === 'string') {
    transcriptFiles = transcriptFiles.filter((e) => e.includes(debug))
  }

  const transcripts = []
  for (const transcriptFile of transcriptFiles) {
    try {
      const lines = await readJsonLines(transcriptFile, { limit: 10 })
      if (lines.length === 0) {
        continue
      }

      /** @type {string | undefined} */
      let conversationSummary

      const choices = lines.flatMap((line, index) => {
        const { summary, toolUseResult, ...meta } = line
        const { message } = line

        let { role } = message ?? {}

        let description
        let hasToolUse = false
        if (summary) {
          description = summary
        }

        if (
          !description &&
          role === 'user' &&
          typeof message.content === 'string' &&
          XMLValidator.validate(message.content)
        ) {
          const content = xmlParser.parse(message.content)
          if (content['command-name'] && content['command-args']) {
            description =
              content['command-name'] + ' ' + content['command-args']
          }
          delete meta.message
        }

        if (!description && typeof message.content === 'string') {
          description = message.content
          delete meta.message
        }

        if (!description && Array.isArray(message.content)) {
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

        if (!description && toolUseResult) {
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

        if (!conversationSummary && !kind && role === 'user') {
          conversationSummary = description
        }

        return {
          name: index + (role ? ` ${role}` : '') + (kind ? ` ${kind}` : ''),
          description: description + '\n\n' + inspect(meta),
        }
      })

      if (debug) {
        await select({
          message: `${path.basename(transcriptFile)}`,
          choices,
        })
      }

      /** @type {string | undefined} */
      let summary = ''
      const summaryNode = lines.find((e) => e.type === 'summary')
      if (summaryNode) {
        summary = summaryNode.summary
      }

      /** @type {{timestamp: string, sessionId: string}} */
      const rootNode = lines.find((e) => e?.timestamp)
      if (!rootNode) {
        // There are several files that only contain summaries and no content
        // throw new Error('Missing root node')
        continue
      }
      if (!rootNode.timestamp) {
        throw new Error('Missing timestamp')
      }

      if (!summary && conversationSummary) {
        summary = conversationSummary
      }

      transcripts.push({
        sessionId: rootNode.sessionId,
        timestamp: rootNode.timestamp,
        summary,
      })
    } catch (error) {
      console.error(`Failed to process ${transcriptFile}:`, error, '\n')
    }
  }

  transcripts.sort((a, b) => b.timestamp.localeCompare(a.timestamp))

  const relativeTime = new RelativeTime()
  const transcript = await select({
    message: 'Select a conversation to export',
    choices: transcripts.map((transcript) => {
      const timestamp = relativeTime.from(new Date(transcript.timestamp)) + ': '
      const summary = transcript.summary.replaceAll(/\s+/g, ' ')
      return {
        name:
          timestamp + truncate(summary, { maxLength: 80 - timestamp.length }),
        value: transcript.sessionId,
      }
    }),
  })
  console.log(transcript)
}
