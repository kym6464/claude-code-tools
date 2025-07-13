# claude-code-tools

This repo contains tools that I wish were built in to [Claude Code](https://claude.ai/code)

## Features

Easily identify old sessions ([#1407](https://github.com/anthropics/claude-code/issues/1407))

- Uses the Claude-generated summary if one exists,
- Falls back to 1st user-written message to jog your memory

Once you've selected a session, you can either:

- Export the session to an HTML file ([#323](https://github.com/anthropics/claude-code/issues/323))

  > This feature utilizes [daaain/claude-code-log](https://github.com/daaain/claude-code-log) and I [reached out to the author](https://github.com/daaain/claude-code-log/issues/6)

- Resume the session in Claude Code

  > Copies a command to your clipboard that you then have to paste + execute

## Demo

[demo.webm](https://github.com/user-attachments/assets/75d64b3b-1a5b-4f4e-b1aa-68bea4e43a90)

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
     node ~/repos/claude-code-tools/src/index.js "$@"
   }
   ```

## Development

Run `npm install` and then invoke `node src/index.js`.

- Pass `--debug` to review session files
- Pass `--debug <sessionId>` to review a particular session file

The code could definitely use an overhaul, but before that can happen we need to write tests. I've decided to kick the can down the road since it works fine for now.
