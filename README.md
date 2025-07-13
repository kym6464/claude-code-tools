# claude-code-export

TUI wrapper around [Claude Code Log](https://github.com/daaain/claude-code-log)

## Demo

<video src="./demo.mp4" controls></video>

## Instructions

1. Install [uv](https://docs.astral.sh/uv/)

2. Run `uvx pycowsay hello world` to ensure `uv` is working correctly

3. Run `npm install` in this directory

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

4. Add this function to your `.rc` file:

   ```bash
   claude-export() {
     node ~/repos/claude-code-export/src/index.js "$@"
   }
   ```

## Development

Run `npm install` and then invoke `node src/index.js`.

- Pass `--debug` to review session files
- Pass `--debug <sessionId>` to review a particular session file

The code could definitely use an overhaul, but before that can happen we need to write tests. I've decided to kick the can down the road since it works fine for now.
