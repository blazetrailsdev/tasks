---
title: "Split validation: syntactic stays with the content, semantic moves to the models"
status: draft
updated: 2026-09-03
rfc: "0136-trailmap"
cluster: null
packages: ["trailties"]
deps: ["move-task-models-into-trailmap"]
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The RFC's validation split has no story. `scripts/validate-lib.mjs` holds two
different kinds of rule, and the application already reaches into it —
`src/readmodel.ts:16` imports `effectiveStoryStatus`, a rule about what a
story's status _means_ when its RFC is not active, out of the content repo's
lint scripts.

Split it where the RFC splits everything else:

| Stays in `tasks`                                                   | Moves to trailmap                                                       |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| Frontmatter parses, required keys, legal enum values, markdownlint | `effectiveStoryStatus`, cross-story dep resolution, RFC-lifecycle rules |

The constraint that forces it is not aesthetic: trailmap binds to loopback, so
GitHub Actions cannot reach it. Content CI has to be self-contained, which
means it can only check what a single markdown file proves about itself.
Everything relational moves to ingest, where the database is — and ingest
refusing bad content is the Rails answer anyway.

Two rules the current validator enforces are worth keeping visible during the
split, because both have caused CI failures on main: a closed RFC may not hold
an unfinished story, and `est-loc` may not exceed the 700 LOC per-PR ceiling.

Build the syntactic half to be deleted. If trailmap goes on to host the content
repo, the gate becomes a receive hook that _does_ have the database and the two
halves collapse into one implementation.

## Acceptance criteria

- Content CI validates frontmatter shape with no network access and no
  database, and still fails a malformed block.
- Semantic rules live in trailmap as model validations, and ingest refuses
  content that breaks them, with the same messages.
- `effectiveStoryStatus` has exactly one definition.
- No rule is enforced in both places.
