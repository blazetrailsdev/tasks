---
title: "StatementPool's per-pid cache is a plain object, as Rails' `{}` is"
status: draft
updated: 2026-10-10
rfc: "0190-native-js-hash-forms"
cluster: carrier-audit
packages: [activerecord]
deps: [native-hash-string-keyed-carriers-to-plain-objects]
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

**Gate: do not promote or start this story until the RFC's open question 4 is
answered.** It is filed so the site is not lost, and it is the one story in
the RFC whose direction is not settled.

`ActiveRecord::ConnectionAdapters::StatementPool`
(`activerecord/lib/active_record/connection_adapters/statement_pool.rb:11`) is
`@cache = Hash.new { |h, pid| h[pid] = {} }`. The outer hash needs the default
proc and stays a ruby-compat `Hash`. The inner `{}` is keyed by SQL string and
uses no `Hash` feature.

trails made the inner cache a `Hash` in trails#8716
(`packages/activerecord/src/connection-adapters/statement-pool.ts:18`), and
`statement-pool-includes-enumerable-and-each-delegates-to-cache` (a `ready`
story in the `activerecord-api-parity-100` RFC) builds on that: with a `Hash`,
`each` can be Rails' one line, `cache.each(&block)`. A plain object has no
`each`, so the two stories pull in opposite directions.

Open question 4 recommends the plain object, with `each` as a `for…of` over
`Object.entries(this.cache)` (`each` is in `NO_JS_CALL_FORM`,
`scripts/api-compare/compare.ts:415`, so the loop needs no callee).

## Acceptance criteria

- [ ] Open question 4 is answered in the RFC's README, and this story's
      direction matches the answer. If the answer is "stay a `Hash`", close
      this story with a reason starting `FALSIFIED:` and change nothing.
- [ ] If the answer is "plain object": the inner cache is a `Record<string, T>`,
      and `#each`, `#key?`, `#[]`, `#length`, `#[]=`, `#clear`, `#delete`
      (`statement_pool.rb:14-51`) keep their Rails bodies, spelled with the
      native forms from the RFC's § "Per-name decisions". The outer `Hash` is
      unchanged.
- [ ] `statement-pool-includes-enumerable-and-each-delegates-to-cache` is
      reconciled first: either it has merged and this story rebases onto it,
      or its acceptance criterion `each(block)` is `this.cache.each(block)` is
      amended in its own file. Do not leave the two contradicting each other.
- [ ] Call gates green with no baseline row added.
- [ ] The statement-pool tests pass on SQLite; say in the PR which adapter
      lanes exercise the pool.

## Definition of done

Converting the cache while open question 4 is unanswered does not close this
story.
