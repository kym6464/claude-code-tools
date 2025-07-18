# claude-code-tools

This repo contains tools that I wish were built in to [Claude Code](https://claude.ai/code)

## Features

Auto-detects your current Claude Code project directory and launches the TUI from [daaain/claude-code-log](https://github.com/daaain/claude-code-log)

This simple wrapper:

- Detects the git root directory of your current project
- Converts it to Claude Code's project naming convention (`/path/to/project` → `~/.claude/projects/-path-to-project`)
- Launches `claude-code-log --tui` with the correct project directory

> All session browsing, exporting, and management functionality is provided by claude-code-log

## Demo

[demo video](https://github.com/user-attachments/assets/01404dcf-aaf2-4b63-87b3-a6ab36bcf47c)

## Instructions

1. Install [node](https://nodejs.org/en)

1. Install [uv](https://docs.astral.sh/uv/)

1. Run `uvx pycowsay hello world` to ensure `uv` is working correctly

1. Run `npm install` in this directory

   ```
   kamalmuradov@kym ~ % uvx pycowsay hello world

     -----------
   < hello world >
     -----------
     \   ^__^
       \  (oo)\_______
         (__)\       )\/\
             ||----w |
             ||     ||
   ```

1. Add this function to your `.rc` file:

   ```bash
   claude-tools() {
     $(node ~/repos/claude-code-tools/src/index.js "$@")
   }
   ```

## Development

Run `npm install` and then invoke `node src/index.js`.
