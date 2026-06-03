---
name: tasks-loop
description: Staggered spawn loop. Wakes every 11 min, picks the next unblocked story — preferring the RFC index via `pnpm tasks next-bundle`, falling back to grepping plan docs — claims it, and spawns one prompt-agent. Use as `/tasks-loop docs/trailties-plan.md docs/tse-plan.md` etc.
disable-model-invocation: false
argument-hint: "<plan-doc-path> [<plan-doc-path>...]  |  pause  |  resume  |  stop"
allowed-tools:
  - Bash
  - Read
  - Skill
---

Self-pacing loop for parallel PR work across one or more plan docs.

## What it does each tick

0. **Print the tick timestamp + check stop sentinel.** First output line of every tick: `[tick HH:MM:SS] tasks-loop <plan-docs>` (use `date +%H:%M:%S`).

   Then check the per-pane stop sentinel: `/tmp/tasks-loop-stopped-${TMUX_PANE#%}` (strip the leading `%` from the pane id). If the file exists, the user has stopped the loop — print `[tick] stop sentinel present, exiting` and **return without doing anything else, including no ScheduleWakeup**. Loop ends.

1. **Audit live panes**: re-derive in-scope by listing tmux panes whose `pane_current_path` is under `~/github/blazetrailsdev/worktrees/`, intersected with worktrees whose names match the loop's tracked prefixes (derived from spawned worktree names this session; default prefixes also include `trailties-`, `fixtures-`, `tse-`, `actionview-`, `actionpack-`, `activerecord-`).
2. **Audit PR queue**: `gh pr list --state open --author "@me" --limit 30 --json number,title,headRefName`.
3. **Apply caps** (defaults — override via flags below):
   - **≤5 live panes** in scope.
   - **≤5 open PRs** in scope.
   - If either cap exceeded → SKIP this tick; just reschedule.
4. **Pick next target** — try the RFC index first, fall back to plan-doc grep:
   1. **RFC path (preferred).** Run `pnpm tasks next-bundle --max-loc 250 --json` from the trails repo. It returns `{ stories: [...], bundle_total_loc, max_loc }`, where each story already has its dependencies merged and RFC closed (the CLI filters to `status: ready` with deps satisfied). Pick the FIRST story in `stories`; use its `file_path` (relative to `$TASKS_DIR`, default `~/github/blazetrailsdev/tasks`) for prompt context — read that story `.md` for scope/deps. If `stories` is empty, fall through to the grep path.
   2. **Claim it.** Before launching the agent, run `pnpm tasks claim <id> --assignee <EXPLICIT_NAME>` (the worktree slug you'll spawn under). The claim does a push-with-retry; on a lost race it exits non-zero (`2` already-claimed, `3` lost-race). **On any claim failure, re-run `next-bundle` and pick the next story** — do not spawn against an unclaimed/contended story. If `next-bundle` then comes back empty, fall through to grep.
   3. **Grep fallback (legacy plan docs).** For any plan doc passed as `$ARGUMENTS` that is NOT backed by an RFC (no matching story in the index), keep the original behavior: grep `- [ ]` lines, pick ONE whose dependencies are merged and that isn't already open or in flight, using LLM judgment per tick. Grep-path picks are NOT claimed (no index row to claim).
5. **Spawn ONE prompt-agent** via `Skill(prompt-agent)` (or call `run.sh` directly). The spawned prompt MUST:
   - Reference the source: for RFC picks, the story `file_path` + story id; for grep picks, the plan doc + the specific PR id.
   - List Rails source path under `scripts/api-compare/.rails-source/`.
   - Include the standard hard-rules block (NO `node:*` imports, NO `process.*`, async fs only, 500 LOC ceiling, NO STACKED PRs, draft + `/link`, conventional commits, no Co-Authored-By, camelCase only).
   - Pass an `EXPLICIT_NAME=<kebab-slug>` so worktree names don't collide — for RFC picks this MUST match the `--assignee` used at claim time.
   - For RFC picks, instruct the worker to mark progress via `pnpm tasks in-progress <id> --pr <N>` after opening the PR and `pnpm tasks done <id> --pr <N>` once merged.
6. **Reschedule** via `ScheduleWakeup` with the same prompt back, default `delaySeconds=660` (11 min). Pass plan-doc paths verbatim in the prompt so the next firing re-reads them.

## What it does NOT do

- **Does not shepherd stuck PRs** — they stay in the queue but the loop neither nudges Copilot reviewers nor flags them. Stuck PRs eventually count against the queue cap until they merge or are closed.
- **Does not respawn orphans** — if a spawned pane exits before its PR merges, the loop ignores the orphan and doesn't restart a shepherd. The PR stays open; user can manually `prompt-agent --restart <worktree>` if needed.
- **Does not stack PRs** — every spawn instructs the worker to branch from main.
- **Does not retry failed picks** — if it tries to spawn and the worker reports the task is already done (file exists, etc.), let the worker exit; the loop will pick something else next tick.

## Control inputs

- `<plan-doc-path>...` — one or more paths; the loop pulls candidate PRs from these each tick.
- `pause` — reschedule the loop with a no-op prompt for 3600s; next firing checks again.
- `resume` — clear pause; next tick spawns.
- `stop` — write `/tmp/tasks-loop-stopped-${TMUX_PANE#%}` (per-pane sentinel) and exit without rescheduling. The next wakeup that arrives sees the sentinel and exits cleanly. To restart in this pane: delete the sentinel (`rm /tmp/tasks-loop-stopped-<n>`) or run `/tasks-loop <plan-doc>` again (the skill should `rm -f` the sentinel on a fresh argv invocation, so a re-invoke is enough).

## Optional flags

Parsed before the plan-doc paths:

- `--live-cap N` (default 5)
- `--queue-cap N` (default 5)
- `--stagger S` (default 660, seconds)
- `--prefix P` (repeatable; in-scope worktree prefix override)

## Prompt construction

The skill body assembles the spawn prompt at runtime from the plan-doc entry. Example minimal worker prompt (the skill expands this from the chosen PR's plan-doc entry):

```text
<slug>: <one-line task title> (~<LOC> LOC).

Plan doc: <path> — read the <PR id> entry.

Dependencies: <list of merged PR refs, e.g. #2191 ✓>.

Scope: <bulleted scope from plan doc>.

Rails source: scripts/api-compare/.rails-source/rails/<path>.

Hard rules:
- NO node:* imports.
- NO process.* references.
- Async fs only.
- No new third-party runtime deps.
- 500 LOC ceiling. NO STACKED PRs. Single PR from main.
- Test names match Rails verbatim.

Constraints (CLAUDE.md):
- camelCase only.
- Open PR as draft. After opening, run /link with the PR number.
- Conventional commits. No Co-Authored-By. No "Generated with Claude Code".

Report PR number.
```

## Tick body (pseudocode)

```bash
# 0. Stop sentinel (per-pane)
SENTINEL="/tmp/tasks-loop-stopped-${TMUX_PANE#%}"
if [ -f "$SENTINEL" ]; then
  echo "[tick $(date +%H:%M:%S)] stop sentinel $SENTINEL present, exiting"
  exit 0  # NO ScheduleWakeup
fi

# 1. Live panes in scope
LIVE=$(tmux -S /tmp/tmux-1000/default list-panes -a -F '#{pane_current_path}' \
  | grep "^/home/dean/github/blazetrailsdev/worktrees/" \
  | awk -F/ '{print $NF}' \
  | grep -cE "$IN_SCOPE_PREFIX_REGEX")

# 2. Open PRs in scope
OPEN=$(gh pr list --state open --author "@me" --limit 30 --json headRefName \
  -q '.[].headRefName' | grep -cE "$IN_SCOPE_PREFIX_REGEX")

# 3. Caps
if [ "$LIVE" -ge "$LIVE_CAP" ] || [ "$OPEN" -ge "$QUEUE_CAP" ]; then
  # skip
else
  # 4a. RFC path: ask the index for a ready story
  BUNDLE=$(pnpm tasks next-bundle --max-loc "$MAX_LOC" --json)
  ID=$(echo "$BUNDLE" | jq -r '.stories[0].id // empty')
  if [ -n "$ID" ]; then
    # 4b. Claim before spawning; on failure the LLM body re-runs next-bundle
    if pnpm tasks claim "$ID" --assignee "$EXPLICIT_NAME"; then
      : # 5. spawn prompt-agent against story file_path — LLM body
    fi
  else
    : # 4c. grep fallback for non-RFC plan docs — LLM body
  fi
fi

# 6. Reschedule (always)
```

## Notes

- The loop is **per-session**: it does not persist state. The wakeup prompt carries all required context (plan-doc paths, caps, stagger).
- Window-name patterns spawned by `prompt-agent` are not stable; this skill matches on **worktree path** instead.
- The 5/5 cap was tuned against this repo's CI throughput; if CI gets faster, raise via `--live-cap`/`--queue-cap`.

## Memory

After 5–10 ticks you'll have spawned worker prompts and pane IDs whose state would be useful next firing. The skill does not persist these — they're rederivable from `gh pr list` + tmux. Trust the rederivation each tick.
