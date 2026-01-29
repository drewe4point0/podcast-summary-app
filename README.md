# Cursor Workspace Template

This template contains all the slash commands and structure for AI-assisted development.

## Structure

- `.cursor/commands/` - Cursor IDE slash commands
- `claude/commands/` - Claude Code commands (command-line tool)

## Available Commands

- `/create-issue` - Quickly capture bugs/features mid-development
- `/explore` - Understand the problem before coding
- `/create-plan` - Generate execution plan with status tracking
- `/execute` - Implement the plan step by step
- `/review` - Comprehensive code review
- `/peer-review` - Cross-model code review
- `/document` - Update documentation after changes
- `/learning-opportunity` - Deep dive explanations

## Usage in Cursor IDE

1. Copy this template folder to start a new project
2. Open the project in Cursor
3. Type `/` in the chat to see all available commands
4. Select a command to use it

## Usage with Claude Code (Command Line)

1. Navigate to your project folder in Terminal
2. Run: `claude @create-issue` (or any other command name)
3. Claude will reference the corresponding .md file

## Customization

Edit any `.md` file to adjust the command behavior for your needs.

## How to Use This Template for New Projects

**Option 1: Copy the entire folder**
```bash
cp -r ~/dev_projects/cursor-workspace-template ~/dev_projects/my-new-project
cd ~/dev_projects/my-new-project
```

**Option 2: Copy just the command folders into an existing project**
```bash
cd ~/dev_projects/my-existing-project
cp -r ~/dev_projects/cursor-workspace-template/.cursor .
cp -r ~/dev_projects/cursor-workspace-template/claude .
```
