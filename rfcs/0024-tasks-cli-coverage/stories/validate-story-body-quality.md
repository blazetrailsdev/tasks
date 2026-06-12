---
title: "Validator: story body content gates (AC checkboxes, Context, Rails refs)"
status: ready
updated: 2026-06-12
rfc: "0024-tasks-cli-coverage"
cluster: guardrails
deps: ["validate-status-consistency"]
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

The validator only reads frontmatter; story **bodies** are unchecked. `tasks
new` scaffolds empty `## Context` and `## Acceptance criteria` sections and
they validate fine — five stories on `main` have no acceptance criteria at
all. The `draft → ready` transition should be a real gate: `ready` means
"specified well enough for an agent to claim blind."

Four gates, all scoped to stories whose status is **past `draft`** (`ready`
onward), so authoring drafts stays friction-free:

1. `## Acceptance criteria` exists and contains at least one `- [ ]` / `- [x]`
   checkbox item.
2. `## Context` exists and is non-empty.
3. For RFCs that opt in via a new `requires-rails-ref: true` RFC frontmatter
   field, the story body must reference a Rails source file (`*.rb` /
   `*_test.rb`) — fidelity-first RFCs (e.g. canonical-schema burndown,
   test-compare) get this; tooling RFCs like this one don't.
4. `est-loc` may be `null` in `draft`, but a `ready` story must carry a real
   estimate — `next-bundle` budgeting depends on it.

## Acceptance criteria

- [ ] The four gates above are enforced in `validate.mjs` for stories with
      status `ready`/`claimed`/`in-progress`/`done`/`blocked`; `draft`
      stories are exempt.
- [ ] `requires-rails-ref` is an optional boolean in RFC frontmatter,
      documented in the template README comment block; absent means false.
- [ ] Failing-fixture tests for each gate; existing `main` content validates
      clean — backfill the stories the gates flag (e.g. the five missing
      acceptance criteria) in the same PR, or flip them to `draft` with a
      one-line justification in the PR description.
- [ ] `tasks new` output reminds the author that the story stays `draft`
      until Context + Acceptance criteria are filled in.

## Notes

Depends on [[validate-status-consistency]] to serialize edits to
`validate.mjs` (same file, avoid concurrent-PR conflicts). Pairs with
[[template-quality-sections]] but doesn't depend on it — the gated sections
already exist in the template.
