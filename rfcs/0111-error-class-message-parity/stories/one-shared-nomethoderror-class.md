---
title: "One shared NoMethodError, extending NameError, for all eight raise sites"
status: draft
updated: 2026-08-17
rfc: "0111-error-class-message-parity"
cluster: duplicate-error-classes
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Ruby has exactly one `NoMethodError` (corelib, `NoMethodError < NameError`), so
a `rescue NoMethodError` anywhere catches every raise site. trails has at least
eight module-local re-declarations of it, each its own class, so a `catch (e) { if
(e instanceof NoMethodError) }` written against one never matches a raise from
another — only the `e.name === "NoMethodError"` string check works, and not every
copy even sets `name`:

- `packages/activesupport/src/method-missing-proxy.ts:10` (extends this
  package's `NameError`, sets `name`; its doc explains why it is module-local)
- `packages/activesupport/src/string-inquirer.ts:20` (added by PR #6649)
- `packages/activesupport/src/array-inquirer.ts:20` (added by PR #6649)
- `packages/activesupport/src/number-helper/rounding-helper.ts:8` (extends
  bare `Error`, NOT `NameError`)
- `packages/activemodel/src/attribute-assignment.ts:296`
- `packages/actionpack/src/action-dispatch/testing/test-process.ts:108`
  (exported, extends bare `Error`)
- `packages/i18n/src/exceptions.ts:123` (exported, extends bare `Error`)
- `packages/date/src/date.ts:829` (extends bare `Error`)

Two divergences compound: the class identity is fragmented, and the copies that
extend bare `Error` break Ruby's `NoMethodError < NameError` hierarchy, so a
`rescue NameError` site (which Ruby guarantees catches a `NoMethodError`) misses
them.

PR #6649 added two of these copies. That was the wrong call at the time — it
matched the shape already in `method-missing-proxy.ts` instead of converging it —
and this story exists to retire all of them, not to ratify the pattern.

## Converged shape

One `NoMethodError extends NameError` with `name = "NoMethodError"`, living
beside `NameError` (`packages/activesupport/src/core-ext/name-error.js` is
already the shared home for the parent) and imported by every raise site. The
`method-missing-proxy.ts` doc comment's "local to this module rather than
exported" rationale is retired with it: the reason given there (callers identify
it by `name` and message) is precisely the workaround the fragmentation forces.

Check whether exporting it adds `parity:api:extra` surface in a Rails-mapped
file before picking the file: `name-error.ts` maps onto
`activesupport/lib/active_support/core_ext/name_error.rb`, which does NOT define
`NoMethodError` (Ruby corelib does), so the export may need a
`@noRailsEquivalent PERMANENT` tag naming corelib as the anchor — the same
treatment RFC 0089 describes for the other interpreter primitives.

## Acceptance criteria

- One `NoMethodError` class; every site above imports it; no module-local
  re-declaration remains (`grep -rn "class NoMethodError" packages/*/src`
  returns one hit).
- It extends `NameError`, per Ruby's `NoMethodError < NameError`; the four
  bare-`Error` copies are gone.
- `pnpm parity:api:extra` gains no untagged novel surface.

## Re-homed from `0023-surfaced-deviations` (2026-08-18)

Moved by the RFC 0023 backlog triage pass into `0111-error-class-message-parity`, which was carved out
of that register for this deviation class. Nothing about the finding changed —
every Rails and trails `file:line` citation above is as originally filed.
