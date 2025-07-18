import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

import spawn from 'nano-spawn'
import { program } from 'commander'

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

  console.log(`uvx claude-code-log --tui ${projectDir}`)
}
