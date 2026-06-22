---
title: "Validator: cross-field status consistency invariants"
status: ready
updated: 2026-06-12
rfc: "0024-tasks-cli-coverage"
cluster: guardrails
deps: ["validate-as-library"]
deps-rfc: []
est-loc: 250
priority: 20
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`scripts/validate.mjs` checks each frontmatter field in isolation (type, enum
membership, references) but never their **joint** validity, so internally
contradictory stories pass: a `done` story with no `pr`, a `ready` story with
a leftover `claim`, a `blocked` story with `blocked-by: null`, a `closed` RFC
with open stories. The CLI keeps these consistent on the happy path, but
hand-edits, crashed agents, and `--force` flips drift silently. This story
makes the validator enforce the lifecycle the top-level README documents.

Also folds in small field-hygiene checks that need no new machinery:

- two RFC dirs sharing a numeric prefix (this has already happened — two
  `0022-*` dirs exist on `main` today; grandfather them via an explicit
  allowlist with a comment so the check still protects future finalizes);
- `created`/`updated` must match `YYYY-MM-DD` (the template's literal
  `YYYY-MM-DD` placeholder currently validates).

## Acceptance criteria

- [ ] `validate.mjs` rejects: `done` without `pr`; `claimed`/`in-progress`
      without `claim` + `assignee`; `in-progress` without `pr`;
      `draft`/`ready` with non-null `claim`, `assignee`, or `pr`; `blocked`
      without `blocked-by`; `blocked-by` set on a non-blocked story.
- [ ] RFC `status: closed` with any story not `done` is an error.
- [ ] Duplicate RFC numeric prefixes are an error; the existing `0022-*` pair
      is allowlisted with a comment explaining why.
- [ ] `created`/`updated` fields must be `YYYY-MM-DD` strings.
- [ ] Decide and document (in the validator comment + top-level README)
      whether `status: ready` with un-`done` deps is legal — the CLI today
      treats `ready` as "specified" and filters claimability by deps; the
      validator must match whatever the CLI does, not invent a third rule.
- [ ] Every invariant has a failing-fixture test, and current `main` (plus
      the allowlist) validates clean — fix any real violations the new checks
      surface in the same PR, each noted in the PR description.

## Notes

Build on the importable `validate()` from [[validate-as-library]] so the new
invariants also run at CLI time, not just at commit. Body-content gates are
deliberately a separate story — see [[validate-story-body-quality]].
