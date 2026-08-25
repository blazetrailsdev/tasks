---
title: "sweep-remaining-erb-spellings-in-trails-test-names"
status: done
updated: 2026-08-11
rfc: "0072-api-compare-parity-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6245
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The naming convention is that trails spells Rails' `ERB` as `TSE` (Trails
Server Embedded) — `TOKEN_RENAMES` in `scripts/api-compare/conventions.ts:20-29`
maps `erb`/`ERB`/`Erb`, `rubyFileToTs` maps the path segment, and
`scripts/test-compare/test-compare.ts:153-167` normalizes both the path and the
describe/test name so either spelling matches. PR #6125 widened the token
boundary so a constant fragment carries the rename too (`ERBUtilTest` →
`TSEUtilTest`), moved `core-ext/erb-util.test.ts` to `core-ext/tse-util.test.ts`,
and renamed that file's describe. That was the whole of the `erb` surface that
PR owned.

What is left is the trails-side test names that still spell it `ERB`, which
`normalizeErb` currently absorbs:

- `packages/activesupport/src/core-ext/string-ext.test.ts` — ~8 `it(...)` names
  of the form `ERB::Util.html_escape ...` / `ERB::Util.html_escape_once ...`
  (from `activesupport/test/core_ext/string_ext_test.rb`).
- `packages/actionview/src/template/handlers/tse.test.ts:122` — an `it(...)`
  name citing `Handlers::ERB.call`.

These collide with two rules that need an owner's call: CLAUDE.md says test
names are never renamed because `parity:test` matches on them, and the
convention says trails writes TSE. `normalizeErb` is what makes both true at
once today, so the decision is whether the normalizer is the settled answer (in
which case document it and close this) or whether the trails-side names should
read TSE and the normalizer stays only as a matcher for the Ruby side.

## Acceptance criteria

- [ ] Decide whether trails-side test names spell `TSE` or keep Rails' `ERB`,
      and record the rule where a porter will read it (CLAUDE.md's test-name
      rule and/or `docs/ruby-ts-conventions.md`).
- [ ] If they are to be renamed, rename the names listed above and confirm
      `pnpm parity:test` credits them (delta non-negative).
- [ ] No `erb`-spelled trails file name, directory, or identifier remains;
      `ERB` survives only where the text is citing the Ruby side.
