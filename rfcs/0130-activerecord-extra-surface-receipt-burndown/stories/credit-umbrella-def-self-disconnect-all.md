---
title: "Credit active_record.rb umbrella def self methods (disconnect_all!)"
status: ready
updated: 2026-09-13
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
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

`packages/activerecord/src/index.ts` carries a file-level
`@noRailsEquivalent PERMANENT MOVED-BY-SHORT-NAME: ..., disconnectAllBang, ...` verdict (trails#7734).
`disconnectAllBang` is not a short-name coincidence: it ports the umbrella
`ActiveRecord.disconnect_all!` (`vendor/rails/activerecord/lib/active_record.rb:510-512`). The Ruby extractor's
`scan_umbrella_file` (`scripts/api-compare/extract-ruby-api.rb`) harvests only `singleton_class.attr_*` config
from the umbrella and skips `def self.` methods, so the name credits against
`ConnectionAdapters::PoolConfig.disconnect_all!` instead.

## Acceptance criteria

- The umbrella `def self.` methods of `active_record.rb` are credited, either by redirecting them onto
  `ActiveRecord::Base` the way umbrella config already is, or by porting them at a mapped TS site.
- `disconnectAllBang` is removed from `index.ts`'s `MOVED-BY-SHORT-NAME` clause, and
  `pnpm parity:api:extra --package activerecord` stays at 0 with no STALE tag.
