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

Read these files first:
1. CLAUDE.md - project architecture and commands
2. plan/todo.json - task list with status, dependencies, phases
3. plan/todo.txt - DETAILED implementation info (code snippets, exact changes, line numbers)

Pick the first task with status 'not-started' from todo.json.

Rules:
- Work on ONE task at a time
- Update todo.json status to 'in-progress' before starting
- When task is done: mark 'completed' in todo.json, log to plan/progress.txt, then exit
- ONLY when ALL tasks are 'completed', print exactly: ${STOP_TOKEN}

Progress log format (append to plan/progress.txt):
  HH:MM - Started task X.Y
  HH:MM - Created/Updated §filename
  HH:MM - Task X.Y complete
  (add ~5 line summary of changes)

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
echo "🦋 Tasks complete: $(grep -c 'Task.*complete' plan/progress.txt 2>/dev/null || echo '0')"
