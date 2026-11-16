---
title: "active-support.ts scores as no-counterpart instead of active_support.rb"
status: draft
updated: 2026-11-16
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

After trails#10206, `pnpm parity:api:extra --package activesupport` reports
`packages/activesupport/lib/active-support.ts` as "[no Rails counterpart]" and
scores all eight members (`testOrder`, `setTestOrder`, `cacheFormatVersion`,
`setCacheFormatVersion`, `toTimePreservesTimezone`,
`setToTimePreservesTimezone`, ...) as novel. They are Rails'
`ActiveSupport` singletons from
`vendor/rails/v8.0.2/activesupport/lib/active_support.rb:100-124`
(`cattr_accessor :test_order`, `def self.cache_format_version`,
`def self.to_time_preserves_timezone`), so the file should map to
`active_support.rb`. The `*Adapter` accessors seated on the same object in
`packages/activesupport/lib/index.ts` have no Rails counterpart at all.

## Acceptance criteria

- `active-support.ts` maps to `active_support.rb` in `scripts/parity/conventions.ts`
  (`RUBY_FILE_TS_OVERRIDES` or the path rule), and its singletons score as
  matched rather than novel.
- The `index.ts` `*Adapter` accessors either converge away or carry a
  `@noRailsEquivalent` receipt.
