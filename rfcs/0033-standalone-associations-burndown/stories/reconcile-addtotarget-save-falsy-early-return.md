---
title: "reconcile-addtotarget-save-falsy-early-return"
status: ready
updated: 2026-07-05
rfc: "0033-standalone-associations-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `replace_on_target` runs `yield(record)` (the insert) between
set_inverse_instance and the target mutation, but NEVER inspects the block's
return value — only a raised exception unwinds before the post-yield target push
(vendor/rails/activerecord/lib/active_record/associations/collection_association.rb:457-483).
`raise ActiveRecord::Rollback` rolls back the DB but does not revert the
in-memory `@target` array, so a non-raising failed save still leaves the record
in `target`.

The OO path is faithful post-PR #4619: `replaceOnTargetAsync`
(collection-association.ts) ignores `save()`'s return and always commits to
target. But the runtime funnel `CollectionProxy#_addToTarget`
(collection-proxy.ts:1308-1326) gates the commit: `if (save && !(await save()))
return record;` — skipping `_commitToTarget`/`afterAdd` when `save()` resolves
falsy without throwing. Its own comment documents this as a workaround because
`create`/`_createThrough` has no surrounding transaction yet. This means OO
`concat` and proxy `push`/`create` disagree on target membership for a
non-raising failed save.

Surfaced in review of PR #4619. The convergence target is Rails: once the
proxy create path gains a transaction wrap, drop the falsy-return early-exit so
both funnels commit to target regardless of save result.

## Acceptance criteria

- Reconcile `_addToTarget`'s falsy-`save` early-return with Rails'
  `replace_on_target` (which commits to target regardless), or document why the
  create-path deviation must persist (missing transaction wrap) and gate its
  removal on that transaction landing.
- OO `concat` and proxy `push`/`create` agree on target membership for a
  non-raising failed save.
