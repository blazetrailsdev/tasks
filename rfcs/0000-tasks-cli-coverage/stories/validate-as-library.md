---
title: "Export validate() as a library for CLI-time, fail-fast checks"
status: draft
updated: 2026-06-11
rfc: "0000-tasks-cli-coverage"
cluster: guardrails
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`validate.mjs` is a script that `process.exit`s; it only runs on commit (the
pre-commit hook) and in CI. The new authoring commands (`new-rfc`, `rfc`,
`set-deps`) should validate **before** committing so they fail fast with a clear
message instead of producing a commit the hook then rejects — leaving a confusing
half-applied state.

## Acceptance criteria

- [ ] Refactor `validate.mjs` so its core is an importable function (e.g.
      `validate({ rfcs, stories }) -> { errors: string[] }`) with no `process.exit`
      / `console` side effects.
- [ ] The existing CLI entry (`scripts/validate.mjs`) becomes a thin wrapper that
      calls the function, prints, and sets the exit code — CI and the hook behave
      identically to today.
- [ ] CLI mutation commands can import and run `validate()` against the
      post-mutation in-memory state and abort cleanly on errors.
- [ ] No behavior change to the validation rules themselves in this story.

## Notes

Enables fail-fast for [[cli-new-rfc]], [[cli-rfc-edit]], and the cycle/reference
checks reused by [[cli-set-deps]]. Independent; can land first.
