---
title: "Port active_record.rb as a real file: the ActiveRecord module and its def self. methods"
status: done
updated: 2026-09-15
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: trails#7759
claim: "2026-09-14T18:07:21Z"
assignee: "converge-active-record-umbrella-onto-the-module"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/activerecord/lib/active_record.rb` is not an autoload manifest. It declares 35
`singleton_class.attr_*` config seats and 12 `def self.` methods on the `ActiveRecord` module itself:
`schema_cache_ignored_table?` (`:205`), `default_timezone=` (`:218`), `db_warnings_action=` (`:235`),
`global_thread_pool_async_query_executor` (`:286`), `global_executor_concurrency=` /
`global_executor_concurrency` (`:298-308`), `permanent_connection_checkout=` (`:314`),
`marshalling_format_version` / `=` (`:463-467`), `eager_load!` (`:499`), `disconnect_all!` (`:510`),
`after_all_transactions_commit` (`:527`), `all_open_transactions` (`:547`).

trails does not port it as a file. `vendor/sources.ts` excludes it from `libEntryFile` on the stated premise
that Rails' framework entry files are "autoload manifests whose `def self.` boot helpers nothing ports" —
false for every name above. Instead `scan_umbrella_file` (`scripts/api-compare/extract-ruby-api.rb:484`) and
`umbrella_base_redirect` (`:1247`) flatten the seats onto `ActiveRecord::Base` tagged `umbrellaConfig`, and
`process_def` / `process_defs` (`:819`, `:863`) return early so the `def self.` methods are never recorded at
all. The consequences: `disconnectAllBang` carries a `MOVED-BY-SHORT-NAME` receipt in `index.ts`,
`Base.globalExecutorConcurrency` and `Base.globalThreadPoolAsyncQueryExecutor` carry CONVERGEABLE receipts,
and CLAUDE.md § "Call-time constant resolution" ratifies the flattening as the rule.

This is the wrong owner: a Rails developer calls `ActiveRecord.disconnect_all!`, not
`ActiveRecord::Base.disconnect_all!`. Review of trails#7752 withdrew an intermediate change that redirected
the `def self.` methods onto `Base` for exactly this reason.

The mechanism to fix it already exists and is proven three times. `libEntryFile` in `vendor/sources.ts:35`
walks a gem's entry file as an ordinary package file — `activerecord/lib/arel.rb` (`:83`), `lib/i18n.rb`
(`:417`) and `lib/rack/test.rb` (`:202`) all use it. `pathFromRubyFile` in `scripts/parity/conventions.ts:392`
already maps a `../<gem>.rb` entry to the package src root, so `active_record.rb` maps to
`packages/activerecord/src/active-record.ts` with no new rule.

This story is step 1 of six. It stands up the module and the credit path and moves the `def self.` methods
only; the 35 seats move in `move-ar-umbrella-seats-batch-1` / `-2` / `-3`, `ar-config.ts` folds in
`fold-ar-config-into-active-record-module`, and the flattening is deleted last in
`retire-umbrella-base-redirect`. **`umbrella_base_redirect` stays alive through steps 1-5** so the `Base`
statics keep crediting while they are still there; double credit for a few PRs is tolerable, a parity dip is
not.

It supersedes `credit-umbrella-def-self-disconnect-all` and `harvest-active-record-umbrella-singleton-defs`,
both of which converge by redirecting onto `Base` — the shape #7752 rejected.

## Findings from the withdrawn spike

The agent that held the two superseded stories built the redirect version first and reverted it from
trails#7757. What it learned, which this story should not re-derive:

- **`def self.default_timezone=` (`:218`) sits on top of an `attr_accessor` writer that is already recorded.**
  Dedupe it when you home it, or the seat's writer is counted twice.
- **Where the 12 defs already score as moves to other TS files**: `isSchemaCacheIgnoredTable` in
  `ar-config.ts`, `afterAllTransactionsCommit` in `transactions.ts`, `disconnectAllBang` in `index.ts` (a free
  function). Two more match only by SHORT NAME to a different method and are not real ports: `eagerLoadBang`
  against `association-relation.ts`, and `disconnectAllBang` against
  `ConnectionAdapters::PoolConfig.disconnect_all!`.
- **Still unported entirely**: `marshalling_format_version` / `marshalling_format_version=` (`:463-467`) and
  `all_open_transactions` (`:547`). They surface as missing, which is correct — report them, do not receipt
  them.
- **The call gate goes red on `any?`** as soon as `isSchemaCacheIgnoredTable` is compared
  (`active_record.rb:205-209`). The fix is `any(...)` from `@blazetrails/activesupport` enumerable-utils, not
  a baseline row.
- **Two receipts become REDUNDANT once these are compared**: `Base.globalThreadPoolAsyncQueryExecutor`
  (`fold-receipted-activerecord-root-and-adapter-names`) and `Base.globalExecutorConcurrency`
  (`harvest-active-record-umbrella-singleton-defs`). Note that `parity:api --extra` does NOT run the
  redundant-tag check and `extra:gate` does not either — check it explicitly.
- **`index.ts`'s file-level `MOVED-BY-SHORT-NAME` tag goes STALE and `extra:gate` `total` goes 0 → 5** the
  moment `disconnectAllBang` becomes a real move. Relocate the tag in the same change.
- `packages/activerecord/src/active-record.test.ts` already exists and is the only caller of `index.ts`'s
  `disconnectAllBang`.

## Acceptance criteria

- `activerecord/lib/active_record.rb` is declared as the activerecord package's `libEntryFile` in
  `vendor/sources.ts`, and the comment there that calls Rails' entry files pure autoload manifests is
  corrected rather than left standing.
- `packages/activerecord/src/active-record.ts` exists, mirroring `active_record.rb`, and exports the
  `ActiveRecord` module's 12 `def self.` methods under their Rails names.
- `disconnectAllBang` moves there from `index.ts`, and `disconnectAllBang` is removed from `index.ts`'s
  `MOVED-BY-SHORT-NAME` clause. The CONVERGEABLE receipts on `Base.globalExecutorConcurrency` and
  `Base.globalThreadPoolAsyncQueryExecutor` are deleted as those methods move.
- The extractor records `def self.` members of `active_record.rb` on the `ActiveRecord` module at
  `active_record.rb` — not redirected to `Base`. `umbrella_base_redirect` and the `umbrellaConfig` branch in
  `compare.ts:4750` are left in place for the seats; they are deleted in `retire-umbrella-base-redirect`.
- The new module is checked for load-order cycles with a plain-node import of the **built** `dist/**.js`
  modules as entry modules, in both directions (a vitest run enters the funnel module first and masks TDZ).
- `pnpm parity:api:extra:gate` green with no STALE tag; `pnpm parity:api` / `pnpm parity:test` deltas
  non-negative; `pnpm parity:api:calls`, `:calls:args`, `:params` clean.
