---
title: "trailmap: answer an agent's question in its session row"
status: draft
updated: 2026-11-11
rfc: "0232-trailmap-fleet-session-redesign"
cluster: fleet-sessions
packages: [actionview]
deps: [fleet-session-card]
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`askCards` (`app/assets/javascripts/fleet-format.js:1082`) renders pending
AskUserQuestions into the Waiting on you panel (`#askPanel`). The RFC's
"Questions in the row" moves each into its session's row, matched by pane.

## Acceptance criteria

- [ ] A pending question renders as a strip inside the row whose worker pane
      matches its `pane`: "Waiting on you", the question, a button per option
      and a free answer with Send, sending the same `answer-ask` requests.
- [ ] A question whose pane matches no row renders as its own row at the top
      of the list.
- [ ] `#askPanel` is removed, and nothing else reads it.
- [ ] Every model-written string is escaped, in text and attributes, as
      `askCards` does today; the existing `askCards` escaping tests are kept
      against the new function.
- [ ] Clicks and typing in the strip never toggle the row's expansion.

## Verification

- `pnpm vitest run test/assets/fleet-format.test.js` (matched, unmatched and
  escaping cases) and `./scripts/dashboard-e2e.sh` (answering by option and
  by free text).
