---
title: "converge-has-many-count-records-select-bang"
status: in-progress
updated: 2026-08-21
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6829
claim: "2026-08-21T17:20:33Z"
assignee: "converge-has-many-count-records-select-bang"
blocked-by: null
closed-reason: null
---

# `HasManyAssociation#count_records` replaces the target instead of `select!`-ing it

## Context

Surfaced by the leading-underscore call candidate (PR #6825).

Rails (`activerecord/lib/active_record/associations/has_many_association.rb:80-95`)
ends with `target.select!(&:new_record?)` — an in-place filter of the target
array — followed by `loaded!`.

trails (`packages/activerecord/src/associations/has-many-association.ts:367-390`)
hands a `retainOnlyNewRecords` callback to a `countRecords` host function, which
calls `_writeTargetStore(target.filter(...))`. Two divergences in one: the host
object is decomposition Rails does not have, and the target is replaced rather
than filtered in place.

Baselined meanwhile in
`scripts/api-compare/call-mismatches-exclude/activerecord/associations/has-many-association.json`.

## Acceptance criteria

- [ ] `countRecords` is Rails' body in one method, with no host-callback object.
- [ ] The target is filtered in place, or the deviation is justified at the call
      site against `_writeTargetStore`'s invariant.
- [ ] The baseline row is deleted and the shard mark tightened.
