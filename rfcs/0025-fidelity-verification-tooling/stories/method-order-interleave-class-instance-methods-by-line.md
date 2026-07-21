---
title: "method-order-interleave-class-instance-methods-by-line"
status: claimed
updated: 2026-07-21
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-07-21T19:05:18Z"
assignee: "method-order-interleave-class-instance-methods-by-line"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by review of PR #5030 (rails-file-structure-method-order per-class keying).

The method-order manifest builder
(`scripts/build-rails-file-structure-manifest.ts` `visitClasses`) walks a Rails
entity's `instanceMethods` then `classMethods`, so class methods are always
appended AFTER instance methods in the expected order. When a Rails class puts
its `class << self` block at the TOP, this inverts Rails order.

Concrete case: `activemodel/lib/active_model/attribute.rb:7-24` defines
`from_database` / `from_user` / `with_cast_value` / `null` / `uninitialized`
in a `class << self` block BEFORE `initialize` (:33) and all instance methods.
The manifest demands them last; the `rails-file-structure-method-order` lint
step (now live in CI via #5030) enforces that non-Rails position.

Root cause: `scripts/api-compare/extract-ruby-api.rb` records `file` per method
but NOT the source line — verified: method objects in
`scripts/api-compare/output/rails-api.json` have
`{name, visibility, params, file, calls, bodyDigest}`, no `line`. Without a
per-method line there is no way to interleave the two lists by source position.

This is pre-existing (the flat manifest had the same append-order) and #5030
does NOT actively worsen it (attribute.ts static positions are byte-identical
to main and the file lints clean), but the new CI enforcement makes it worth
fixing exactly.

## Acceptance criteria

- [ ] `extract-ruby-api.rb` captures a per-method source line (the Ripper AST
      carries `[lineno, col]` position tuples; `def`/`defs`/attr insertion
      points already thread `file`, add `line`).
- [ ] `build-rails-file-structure-manifest.ts` merges `instanceMethods` +
      `classMethods` by line into one source-ordered list per class bucket,
      instead of instance-then-class append.
- [ ] `attribute.ts`'s `class << self` factory methods (`fromDatabase`, …) are
      expected BEFORE the instance methods, matching attribute.rb:7-24.
- [ ] Regression-safe for all api:compare consumers of rails-api.json (the
      `line` field is additive; existing consumers ignore it).
