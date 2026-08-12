---
title: "Teach the call-arg comparator Ruby to_sym, including inside kwargs values"
status: done
updated: 2026-08-12
rfc: "0096-naming-identifier-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 6397
claim: "2026-08-12T02:46:02Z"
assignee: "naming-comparator-to-sym-residue"
blocked-by: null
closed-reason: null
---

## Context

PR #6391 taught `refKeysEqual` (`scripts/api-compare/call-args.ts`) the Ruby
`to_s` family: the Ruby extractor describes `table_name.to_s` as the CALL and
drops the receiver, so the key is `ref:toS` and no rename is detectable. That
change took the `naming` class from 464 to 410 rows (shape unchanged at 378).

Re-measuring the residue afterwards, the single largest remaining family is the
SAME tooling shape with a different built-in: Ruby `to_sym`, recorded as
`ref:toSym`, again with the receiver dropped. Measured rows in
`output/call-arg-mismatches.json` after #6391:

    naming  new                   ['ref:subtype', 'ref:toSym'] -> ['ref:subtype', 'ref:typname']
    naming  add                   ['ref:toSym', "str:can't be modified because it is encrypted"] -> ['ref:attr', ...]
    naming  establish_connection  ['ref:toSym'] -> ['ref:environment']   (x2)
    naming  delete                ['ref:toSym'] -> ['ref:ext']
    shape   connected_to          ['kwargs{shard=ref:toSym}'] -> ['kwargs{shard=ref:shardKey}']

A Ruby Symbol is a JS string (CLAUDE.md, "Symbols vs strings"), so `x.to_sym`
in the port is just `x` — exactly the `to_s` situation, and equally
unfalsifiable as a rename signal. Note the `connected_to` row is classed
`shape` because the `toSym` sits INSIDE a `kwargs{}` value, so the fix has to
reach the nested key too, not only the top-level positional arm.

## Converged shape

Extend the `to_s` arm in `refKeysEqual` to the receiver-dropping built-ins that
carry no rename signal (`to_s`, `to_sym`, and whichever siblings the artifact
shows), keeping it a named list rather than a blanket "any `ref:` matches any
`ref:`". Verify the nested-`kwargs` path routes through the same comparison so
the `connected_to` row moves out of `shape` rather than staying there.

## Acceptance criteria

- [ ] Ruby `ref:toSym` compares equal to the TS `ref:` the port passes, by the
      same rule and in the same seam as `ref:toS` (call-args.ts#refKeysEqual).
- [ ] A `toSym` nested inside a `kwargs{}` value compares the same way, so the
      `connected_to` row leaves the `shape` class.
- [ ] Unit tests in `scripts/api-compare/call-args.test.ts` cover the
      positional and the nested-kwargs arm, plus a negative rename case.
- [ ] `API_COMPARE_FORCE=1 pnpm parity:api --calls` shows `naming` drop by the
      rows this family accounts for, with `shape` non-increasing.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` stay green.
