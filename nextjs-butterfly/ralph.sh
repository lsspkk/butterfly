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
  echo "🦋 LOOP $i of $MAX_ITERS"
  echo "════════════════════════════════════════"
  echo ""

  # Run cursor-agent in headless mode with structured output
  cursor-agent -p --force \
    --model sonnet-4.5 \
    --output-format stream-json \
    "# Butterfly Game Development Task

First read some info files from plan folder
1. Read CLAUDE.md to understand the project architecture
2. Read plan/todo.json for available tasks
   Pick the first available task with status 'not-started'

Rules:
- ONLY WORK ON A SINGLE TASK AT A TIME
- Update plan/todo.json status to 'in-progress' before starting
- Task is NOT complete until tests pass (check testRequired field)
- APPEND (do not overwrite) progress log into file in project root called plan/progress.txt with timestamps after each agent action, as described below
- ONLY when ALL tasks AND tasks are 'completed', print exactly: ${STOP_TOKEN}
- Check plan/todo.json: if ANY task has status 'not-started', do NOT output stop token
- When task is done
  - mark task 'completed' in plan/todo.json
  - append to plan/progress.txt the log line, 
    and a short (about 10 lines) summary of changes made
  - stop working: exit this agent session

Example of log line formats that you use in plan/progress.txt file:

HH:MM - Started Epic X.Y 
HH:MM - Epic X.Y complete
HH:MM - Started task X.Y 
HH:MM - Task X.Y complete
HH:MM - Created §filenames
HH:MM - Updated §filenames
HH:MM - Tests pass §test_filename
HH:MM - Tests fail §test_filename
HH:MM - Installed package_name
HH:MM - [Loop N] Task X.Y complete

IMPORTANT: After completing ONE task, if more work remains, 
end your response WITHOUT the stop token. 
The loop will continue.

Work incrementally. Small, safe edits. Begin." \
    | tee ".ralph-loop-${i}.ndjson"

  echo ""

  # Debug: extract result line for stop condition check
  RESULT_LINE=$(grep '"type":"result"' ".ralph-loop-${i}.ndjson" 2>/dev/null || echo "")

  # Stop condition: check for STOP_TOKEN in the RESULT LINE ONLY (not whole file)
  if [[ -n "$RESULT_LINE" ]] && echo "$RESULT_LINE" | grep -q "$STOP_TOKEN"; then
    echo ""
    echo "✅ Stop token received in agent result. All butterflies rescued! 🦋"
    break
  fi

  if [[ $i -eq $MAX_ITERS ]]; then
    echo ""
    echo "⚠️  Max loops reached"
  fi
  
  echo ""
  echo "🦋 Next loop..."

  echo ""
done

echo ""
echo "🏁 Ralph the Butterfly complete"
echo "📊 Total loops: $i"
echo "🦋 Subtasks complete: $(grep -c 'Subtask.*complete' plan/progress.txt 2>/dev/null || echo '0')"
