---
title: "Sweep toBeUndefined ports of assert_nil onto assertNil"
status: ready
updated: 2026-09-30
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The `toBeNull` sweep (`assert-nil-helper-sweep-remaining-packages`, trails#8272,
and its activerecord follow-ups) converts only `toBeNull`. Rails-ported tests
also spell `assert_nil` as `expect(x).toBeUndefined()`. That is the mirror
image of the same miss: it fails on a `null` that Ruby's `nil?` would accept.
`assertNil` (`packages/activesupport/src/testing/assertions.ts`, `obj == null`)
accepts both, as `vendor/minitest/v5.27.0/lib/minitest/assertions.rb:305-308`
does. The comparer scores `toBeUndefined` as `nil`
(`scripts/test-compare/assertion-kinds.ts:172`), so a swap is kind-neutral.

Sites in Rails-matched tests where the Rails test has more `assert_nil` than
the TS test has `assertNil` / `toBeNull`, as of 2026-09-30: activesupport 81,
activerecord 42, actiondispatch 41, actioncontroller 14, activemodel 8,
rack-test 8, trailties 7. For example:

- `access custom configuration point`: `x.i_do_not_exist.zomg`
  (`railties/test/application/configuration/custom_test.rb:33`)
- `no content type`: `media_type` (`actionpack/test/dispatch/request_test.rb:1024`)
- mime-type `unregister`, flash `flash now`, parameters mutators
  `delete returns nil when the key is not present`

rack, rack-session and i18n (61 sites) cannot import activesupport. They belong
with `assert-nil-helper-home-below-activesupport-for-gem-ports`.

Pairing method: the one in `assert-nil-sweep-activerecord-a-to-h`, with the
`toBeUndefined` kind added. Read the Rails body wherever the counts are
ambiguous. A `toBeUndefined` that ports `assert_equal nil`, or that belongs to a
TS-only test, stays unchanged.

## Acceptance criteria

- [ ] Every `toBeUndefined()` in a non-`.trails` test file that ports a Rails
      `assert_nil` uses `assertNil`, in the packages listed above. Split into
      one PR per package if the diff needs it.
- [ ] `pnpm parity:test:assertions` stays OK, and the mismatch totals in
      `convention-comparison.json` are unchanged.
