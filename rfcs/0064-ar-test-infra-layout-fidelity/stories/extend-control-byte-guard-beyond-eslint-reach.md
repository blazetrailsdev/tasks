---
title: "Extend the raw-control-byte guard to tracked non-JS/TS sources"
status: done
updated: 2026-07-31
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 5699
claim: "2026-07-31T01:42:04Z"
assignee: "extend-control-byte-guard-beyond-eslint-reach"
blocked-by: null
closed-reason: null
---

## Context

PR #5688 fixed a raw NUL byte in
`packages/activerecord/src/support/canonical-table-rebuild.ts` and added the
`blazetrails/no-raw-control-bytes` ESLint rule
(`eslint/no-raw-control-bytes.mjs`, wired in `eslint.config.mjs` at the
`files: ["**/*.ts", "**/*.mts", "**/*.mjs", "**/*.js"]` block).

That guard only reaches files ESLint parses. A raw control byte in any other
tracked text source hides it from grep exactly the same way — `grep -rn`
returns nothing and `rg -n` prints only `binary file matches`. This matters
most for files tooling greps or diffs by hand:

- JSON manifests under `eslint/` (`rails-deprecated-methods.json`,
  `rails-callback-invocations.json`, the `*-exclude.json` allowlists)
- Ruby under `scripts/api-compare/` (`extract-ruby-api.rb`)
- `.md` RFC/story prose, `.yml` CI workflows, `.sql` fixtures

The original bug went unnoticed for months precisely because the failure is
silent: tooling reading via `readFile(..., "utf8")` is unaffected, so nothing
errors — an audit just gets a wrong answer.

## Acceptance criteria

- A repo-wide check covers tracked text sources ESLint does not lint, at
  minimum `.json`, `.rb`, `.md`, `.yml`, `.sql`.
- The check runs somewhere it cannot be skipped (CI job or lint-staged), and
  matches the ESLint rule's byte set: C0 except tab/LF/CR, plus DEL and C1.
- A regression cover fails on a fixture containing a raw NUL and passes once
  it is written as an escape.
- Files that are legitimately binary (images, `.tsbuildinfo`) are excluded
  rather than escaped.
