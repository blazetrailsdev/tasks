---
title: "Exported ActiveSupport object is not the Autoload namespace module"
status: draft
updated: 2026-09-27
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
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

Rails has one `ActiveSupport` module: `extend ActiveSupport::Autoload`
(`vendor/rails/v8.0.2/activesupport/lib/active_support.rb:40`) and its singleton
methods — `cattr_accessor :test_order` (`:100`), `def self.cache_format_version` /
`=` (`:106-112`), `def self.to_time_preserves_timezone` / `=` (`:114-124`),
`error_reporter` (`:103-104`) — all live on the same object.

trails has two:

- `packages/activesupport/src/namespaces.ts` — `ActiveSupport`, the Autoload
  namespace (`extend(ActiveSupport, Autoload)`, `BroadcastLogger` seated on it).
  Not exported from the package.
- `packages/activesupport/src/index.ts` — `export const ActiveSupport`, a plain
  object literal carrying `errorReporter`, `testOrder`, `cacheFormatVersion` /
  `setCacheFormatVersion` (added by trails#8180) and the invented
  `*Adapter` accessors, with the bodies in `packages/activesupport/src/active-support.ts`.

`active-support.ts` also declares its members out of Rails order: `testOrder`
(`:100`) comes after `toTimePreservesTimezone` (`:114`).

`initialize-cache-skips-cache-format-version` asked for the seat on
`namespaces.ts`. trails#8180 put it on the exported object instead, because
importing `cache/store.js` into `namespaces.ts` would pull the cache graph into a
module that must stay near-leaf.

## Acceptance criteria

- One `ActiveSupport` object: the exported one is the Autoload namespace, and it
  carries `active_support.rb`'s singleton methods at their Rails names. Reach the
  cache delegation at call time (`ActiveSupport.Cache` seated by its defining
  module, as `ActiveRecord.Base` is) so `namespaces.ts` takes no import edge into
  the cache graph.
- `active-support.ts` members follow `active_support.rb` order.
- Plain-node imports of the built `dist/index.js` and `dist/namespaces.js` as
  entry modules both succeed.
