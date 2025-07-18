# claude-code-tools

A bash wrapper for [claude-code-log](https://github.com/daaain/claude-code-log) that auto-detects your current Claude Code project directory.

## Features

A simple bash function that:

- Detects the git root directory of your current project
- Converts it to Claude Code's project naming convention (`/path/to/project` → `~/.claude/projects/-path-to-project`)
- Launches `claude-code-log --tui` with the correct project directory
- Falls back to launching without project directory (the default behavior) if anything goes wrong

## Demo

[demo video](https://github.com/user-attachments/assets/659e8472-3c28-41af-b7b5-af2e752c31fa)

## Instructions

1. Install [uv](https://docs.astral.sh/uv/)

2. Run `uvx pycowsay hello world` to ensure `uv` is working correctly

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

3. Copy + paste the [claude-export](./claude-export) function into your `.rc` file

4. Run `claude-export` from a directory in which you've run `claude`
