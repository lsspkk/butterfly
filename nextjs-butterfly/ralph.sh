#!/bin/zsh
setopt ERR_EXIT PIPE_FAIL NO_UNSET


# Config
MAX_ITERS="50"
STOP_TOKEN="<promise>COMPLETE</promise>"
PROJECT_DIR="/home/lvp/study/butterfly/nextjs-butterfly"

cd "$PROJECT_DIR"


echo "🦋 Ralph the Butterfly Starting..."
echo ""

# 3) Main loop
for i in {1..$MAX_ITERS}; do
  echo ""
  echo "════════════════════════════════════════"
  echo "🦋 FLUTTER $i of $MAX_ITERS"
  echo "════════════════════════════════════════"
  echo ""

  # Run cursor-agent in headless mode with structured output
  cursor-agent -p --force \
    --model sonnet-4.5 \
    --output-format stream-json \
    "# Butterfly Game Development Task

First read some info files from plan folder
1. Read CLAUDE.md to understand the project architecture
2. Read plan/todo2.json for available tasks
   Pick the first available subtask with status 'not-started'

Rules:
- ONLY WORK ON A SINGLE SUBTASK AT A TIME
- Update plan/todo2.json status to 'in-progress' before starting
- Task is NOT complete until tests pass (check testRequired field)
- APPEND (do not overwrite) progress log into file in project root called plan/progress.txt with timestamps after each agent action, as described below
- ONLY when ALL tasks AND subtasks are 'completed', print exactly: ${STOP_TOKEN}
- Check plan/todo2.json: if ANY task/subtask has status 'not-started', do NOT output stop token
- When subtask is done
  - mark subtask 'completed' in plan/todo2.json
  - append to plan/progress.txt the log line, 
    and a short (about 10 lines) summary of changes made
  - if all subtasks of tasks are now complete, do git commit
  - stop working: exit this agent session

Example of log line formats that you use in plan/progress.txt file:

HH:MM - Started Task X.Y 
HH:MM - Task X.Y complete
HH:MM - Started Subtask X.Y 
HH:MM - Subtask X.Y complete
HH:MM - Created §filenames
HH:MM - Updated §filenames
HH:MM - Tests pass §test_filename
HH:MM - Tests fail §test_filename
HH:MM - Installed package_name
HH:MM - [Flutter N] Subtask X.Y complete

IMPORTANT: After completing ONE subtask, if more work remains, 
end your response WITHOUT the stop token. 
The loop will continue.

Work incrementally. Small, safe edits. Begin." \
    | tee ".ralph-flutter-${i}.ndjson"

  echo ""

  # Debug: extract result line for stop condition check
  RESULT_LINE=$(grep '"type":"result"' ".ralph-flutter-${i}.ndjson" 2>/dev/null || echo "")

  # Stop condition: check for STOP_TOKEN in the RESULT LINE ONLY (not whole file)
  if [[ -n "$RESULT_LINE" ]] && echo "$RESULT_LINE" | grep -q "$STOP_TOKEN"; then
    echo ""
    echo "✅ Stop token received in agent result. All butterflies rescued! 🦋"
    break
  fi

  if [[ $i -eq $MAX_ITERS ]]; then
    echo ""
    echo "⚠️  Max flutters reached"
  fi
  
  echo ""
  echo "🦋 Fluttering to next loop..."

  echo ""
done

echo ""
echo "🏁 Ralph the Butterfly complete"
echo "📊 Total flutters: $i"
echo "🦋 Butterflies rescued: $(grep -c 'Subtask.*complete' plan/progress.txt 2>/dev/null || echo '0')"
