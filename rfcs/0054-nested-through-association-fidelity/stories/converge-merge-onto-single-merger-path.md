---
title: "converge-merge-onto-single-merger-path"
status: ready
updated: 2026-07-08
rfc: "0054-nested-through-association-fidelity"
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

`vendor/rails/activerecord/lib/active_record/relation/spawn_methods.rb:33-52` — Rails
has ONE merge algorithm. `merge!` = `Merger.new(self, other).merge` (or `HashMerger`
for a hash, `instance_exec(&other)` for a proc), and `Merger#merge` (merger.rb) mutates
the relation it is given in place and returns it. `merge` = `spawn.merge!(other)` — the
non-destructive variant just clones via `spawn` first, then runs the same `merge!`. So
`merge`/`merge!` cannot diverge.

trails had the structure INVERTED: `performMerge` (merge) held the algorithm by
constructing a `Merger` that cloned internally, while `mergeBang` (merge!)
hand-duplicated the field-by-field copy. This split caused a real drift bug: the
cross-model preload/includes reflection-nesting (PR #4742) landed in `Merger` but was
missing from `mergeBang`, so `Comment.joins(:post).merge!(Post.preload(:readers))`
behaved differently from `.merge(...)`. PR #4742 papered over it by extracting shared
fold helpers (`merge-joins.ts`, `merge-preloads.ts`); this story removes the root cause.

## Acceptance criteria

- `Merger#merge` mutates `this.relation` in place and returns it (no internal `_clone`).
- `mergeBang` (merge!) dispatches Relation→`Merger`, Hash→`HashMerger`, proc→`call(this)`,
  else raise — matching `spawn_methods.rb:43-51`.
- `performMerge` (merge) = falsey-guard then `this.spawn().mergeBang(other)`.
- The hand-duplicated field-copy block in `mergeBang` is deleted; both entry points run
  the single `Merger#merge`.
- `merge` stays non-destructive (receiver untouched); `merge!` mutates in place and
  returns the same object. Existing relation/association/scoping suites stay green.

## Non-goals

- Porting Rails' `spawn` `already_in_scope?` scope-registry check (trails `spawn` ==
  `_clone` today) — separate scoping-registry work; not required for this convergence.
- Implementing `merge`'s Array branch (`records & other`) — trails never had it; behavior
  unchanged (Array falls through to HashMerger).
