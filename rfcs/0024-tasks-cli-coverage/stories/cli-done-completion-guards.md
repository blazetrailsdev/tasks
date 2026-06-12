---
title: "tasks done: unchecked-checkbox guard + est-loc vs actual delta"
status: ready
updated: 2026-06-12
rfc: "0024-tasks-cli-coverage"
cluster: guardrails
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`tasks done <id> --pr <N>` (trails `scripts/tasks/cli.ts`) only verifies the
PR isn't OPEN (`checkPrNotOpen`). Nothing closes the loop on the story's own
acceptance criteria: an agent can mark a story `done` with every `- [ ]` box
unchecked, and nobody is forced to reconcile "what the story asked" against
"what the PR shipped". Two cheap guards:

1. **Checkbox guard** — refuse `done` (without `--force`) while the story
   body contains unchecked `- [ ]` items. The agent either checks them off
   (asserting they're satisfied) or edits the criteria with a reason — which
   is exactly the review moment we want at close time.
2. **Estimate feedback** — fetch the merged PR's additions+deletions via
   `gh pr view --json additions,deletions` and print the actual-vs-`est-loc`
   delta. Advisory only (never blocks), but over time calibrates estimates
   against the 500-LOC ceiling instead of `est-loc` being a write-once guess.

## Acceptance criteria

- [ ] `tasks done` exits non-zero with the list of unchecked items when the
      story body has any `- [ ]` checkbox; `--force` bypasses with a printed
      warning.
- [ ] Checked boxes (`- [x]`, case-insensitive) and non-checkbox bullets are
      ignored; stories with no checkboxes at all pass the guard unchanged.
- [ ] On success, `done` prints `est-loc <E> vs actual <A> (<delta>)` when
      both are available; gh failures or `est-loc: null` degrade to silence,
      never an error.
- [ ] Unit tests cover: unchecked-blocks, `--force` bypass, checked-passes,
      and the delta line (gh stubbed, matching the existing `checkPrNotOpen`
      test pattern in `cli.test.ts`).

## Notes

Trails-repo change only (`scripts/tasks/cli.ts`), no tasks-repo schema
change. Complements [[validate-story-body-quality]], which guarantees the
checkboxes exist in the first place.
