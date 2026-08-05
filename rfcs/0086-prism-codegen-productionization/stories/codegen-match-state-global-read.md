---
title: "$~ reads image as rubyLastMatch(), not a generic global read"
status: ready
updated: 2026-08-05
rfc: "0086-prism-codegen-productionization"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #6112 imaged `$1` (`NumberedReferenceReadNode`) as `rubyLastMatch()?.[n]`
and `$&`/`` $` ``/`$'`/`$+` (`BackReferenceReadNode`) as `rubyBackRef("$&")`,
both backed by the `rubyMatch` last-match state in
`scripts/prism-codegen/runtime.ts`.

Ruby's `$~` itself does **not** parse as either node — prism answers a
`GlobalVariableReadNode` named `$~` (verified against `@ruby/prism`), so it
falls through to whatever the generic global-read image emits rather than to
the last-match state the sibling reads now share. The same is true of `$~`'s
writes.

`scripts/prism-codegen/handlers/misc.ts` is where the two reference reads are
registered, next to where the global-read image would need to special-case the
name.

## Converged shape

A `GlobalVariableReadNode` named `$~` images as `rubyLastMatch()`, so every
match-state read in a generated body goes through the one runtime helper.

## Acceptance criteria

- [ ] `$~` reads image as `rubyLastMatch()`.
- [ ] Unit coverage in `scripts/prism-codegen/codegen.test.ts` alongside the
      `$1` / `$&` cases.
- [ ] 0 parse errors invariant holds.
