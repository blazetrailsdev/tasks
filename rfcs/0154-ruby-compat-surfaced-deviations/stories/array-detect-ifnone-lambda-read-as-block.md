---
title: "ruby-compat: detect/find take ifnone and the block in separate slots"
status: draft
updated: 2026-10-13
rfc: "0154-ruby-compat-surfaced-deviations"
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

`packages/ruby-compat/src/array.ts` `ARRAY_METHOD_TABLE.detect` (trails#8854)
decides whether a block was given with `rbObjIsProc(argv.at(-1))`, then hands
`argv` to `Enumerable.find` (`packages/ruby-compat/src/enumerable.ts`), which
pops its last argument as the block.

`enum_find` (`vendor/ruby/v3.3.11/enum.c:361`) takes an optional `ifnone`
callable and a block, and `RETURN_ENUMERATOR`s when no block is given. So
`ary.detect(-> { 0 })` with no block answers an enumerator in Ruby. Here the
lambda is the last argument, is read as the block, and is called with each
element. JS cannot tell a trailing lambda from a block by position; the
convention that a trailing function is the block is `blockArg`
(`packages/ruby-compat/src/string/support.ts:19-33`).

The only trails caller is `Relation#detect`
(`packages/activerecord/src/relation.ts`, `ENUMERABLE_DELEGATES.detect`), which
always passes the block alone.

## Acceptance criteria

- [ ] `detect` / `find` take `ifnone` and the block in separate parameter slots
      (`detect: (self, ifNone, block)` with the caller passing `undefined` for a
      skipped `ifnone`, per CLAUDE.md "An optional positional before trailing
      options or a block"), in the table entry and in `Enumerable.find`.
- [ ] `rbFSend(ary, "detect", lambda)` with no block answers the elements its
      enumerator would yield, as the other block-less entries do.
- [ ] `Relation#detect` is updated to the new slots.
