---
title: "Port i18n/test/i18n/interpolate_test.rb onto interpolate.test.ts"
status: done
updated: 2026-08-03
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 6013
claim: "2026-08-03T20:00:43Z"
assignee: "i18n-interpolate-test-port"
blocked-by: null
closed-reason: null
---

# Port i18n/test/i18n/interpolate_test.rb onto interpolate.test.ts

## Context

`parity:test --package i18n` reports `i18n/interpolate_test.rb` at 0/14 after
the test-compare enrollment (#6002). The implementation is already ported —
`packages/i18n/src/interpolate/ruby.ts` mirrors
`vendor/i18n/lib/i18n/interpolate/ruby.rb` — but its only coverage is the
trails-authored `interpolate/ruby.trails.test.ts`, so none of the gem's 14
cases are matched by name.

Note the path asymmetry: the Ruby source is `lib/i18n/interpolate/ruby.rb` but
its test is `test/i18n/interpolate_test.rb` (no `interpolate/` directory), so
test-compare's convention target is `packages/i18n/src/interpolate.test.ts` at
the package root, not `interpolate/ruby.test.ts`.

The suite drives `I18n.interpolate` (`vendor/i18n/lib/i18n.rb`), which the
facade already exports, and covers named placeholders
(`vendor/i18n/test/i18n/interpolate_test.rb:7`), sprintf-syntax placeholders
(`:15`), non-recursion (`:19`), and the `ReservedInterpolationKey` /
`MissingInterpolationArgument` raise paths.

## Acceptance criteria

- `packages/i18n/src/interpolate.test.ts` carries the gem's cases under their
  verbatim Rails names; `parity:test --package i18n` shows
  `i18n/interpolate_test.rb` matched.
- Any case that cannot port is left measured as missing, not excluded — the
  enrollment PR established that `unported-files.ts` is not a deferral list.
- Trails-only assertions stay in `interpolate/ruby.trails.test.ts`; delete only
  the ones the ported cases make redundant.
