---
title: "A new File/Dir member raises ruby-compat's extra-surface total despite its PERMANENT receipt, blocking the flip chain"
status: in-progress
updated: 2026-09-04
rfc: "0135-platform-adapters-in-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 160
priority: 16
pr: 7470
claim: "2026-09-04T00:19:14Z"
assignee: "extra-surface-gate-blocks-new-file-dir-members"
blocked-by: null
closed-reason: null
---

## Context

RFC 0135's flip chain adds `File` / `Dir` members as the call sites that need
them arrive. The extra-surface ratchet makes that cost a mark increase per
member, even when the member is a real Ruby core method carrying a
`@noRailsEquivalent PERMANENT` receipt — and the mark is only-shrink, so the
gate turns red and the documented remedies ("delete the name", "add a
receipt") neither apply.

Measured on #7442. `file.ts` and `dir.ts` are scored as files "no Rails file
maps onto", which `scripts/api-compare/extra-surface.ts` reports as `NoCntrp`
and scores **with an empty allowed set** — so a receipt at the declaration does
not exempt the name there, and any member whose short name Rails happens to
define elsewhere counts as `moved` and raises `total`. Adding `Dir.pwd`
(`vendor/ruby/dir.c:1174`) took ruby-compat from `total: 30` to `31` and reddened
`pnpm parity:api:extra:gate`; `pwd` has 17 hits in `rails-api.json`.
`File.mtime` (25 hits) and `File.binwrite` (16 hits) landed in the same PR and
did NOT raise it, so the rule is not simply "Rails names the method" — the
scoring needs pinning down before the next link can proceed.

`Dir.pwd` was dropped from #7442 to keep the gate green
(`File.expandPath(File.join("db", "schema.ts"))` covers its one call site,
since `expand_path` already resolves against the working directory), but the
remaining links — `flip-file-dir-call-sites-actionpack-and-actionview`,
`-trailties`, `-rack`, and `port-io-and-process-classes-and-unexempt` — will
each want members this package does not have yet, and will each hit this.

Note the interaction that made the cause hard to find: `interface X extends Y`
adds `Y`'s members to that file's measured surface, so a structural type
declared for the fs contract can move the count on its own. `Bytes` was
declared as `interface Bytes extends Uint8Array` first and became
`type Bytes = Uint8Array & {...}` for that reason.

## Acceptance criteria

- The scoring rule for a `NoCntrp` file is written down: which of a Ruby-core
  class's members count toward `total`, and why `mtime`/`binwrite` differ from
  `pwd` today.
- A `@noRailsEquivalent PERMANENT` receipt on a Ruby-core member in
  `packages/ruby-compat/src/file.ts` / `dir.ts` / `io.ts` / `process.ts` exempts
  it from `total`, the way it already exempts a name in a Rails-mapped file —
  or, if that is the wrong answer, the RFC records the alternative and the
  remaining flip stories are re-estimated to include the mark work.
- `Dir.pwd` is restored with its MRI citation and
  `packages/activerecord-cli/src/bin/trails-models-dump.ts:157` reads
  `File.join(Dir.pwd(), "db", "schema.ts")` as Ruby would.
- `pnpm parity:api:extra:gate` green, with ruby-compat still pinned at
  `novel: 0`.
