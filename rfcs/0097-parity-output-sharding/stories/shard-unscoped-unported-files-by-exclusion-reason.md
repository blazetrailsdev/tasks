---
title: "Shard unported-files/unscoped.ts by exclusion reason"
status: ready
updated: 2026-08-10
rfc: "0097-parity-output-sharding"
cluster: api-compare
packages: []
deps: []
deps-rfc: []
est-loc: 550
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #6340 split `scripts/parity/unported-files.ts` into
`scripts/parity/unported-files/`: one module per `package` value, plus
`unscoped.ts` for the 106 entries that carry no `package`, `types.ts` for the
schema and the `UnportedFile` type, and `index.ts` merging the shards and
owning the three `is*Unported` predicates.

That fixed the conflict hotspot only partially. The six package shards are
17–150 lines each, but `unscoped.ts` is still **~1,040 lines and holds 106 of
the 154 entries** — and it is where most new exclusions land, because
`package` is only required when the same basename exists in more than one
package. So the "every agent appends to the bottom of one file" conflict that
motivated the split still applies to the unscoped majority.

The constraint that makes this non-trivial: the shard axis must be a **fact
about the entry**, never a scoping claim. Moving an entry by adding
`package:` to it narrows what parity:api / parity:test exclude — a silent
parity movement, and the exact bug #6340 was written to avoid.

### The axis that works

`unscoped.ts` already carries the answer in its own section banners, inherited
verbatim from the pre-split file. They partition it by **why** the entry is
excluded, which is a property of the entry, not a package scope:

- `// --- Permanently not-portable: GVL / thread-model ---`
- `// --- Permanently not-portable: Rake tasks / dbconsole PTY ---`
- `// --- Permanently not-portable: single-process SQLite driver limits ---`
- `// --- Permanently not-portable: Ruby Module namespace / constant-path semantics ---`
- `// --- Permanently not-portable: Ruby SimpleDelegator ---`
- `// --- Permanently not-portable: scattered YAML/Marshal serialization ---`
- `// --- Permanently not-portable: Ruby serialization formats ---`
- `// --- Permanently not-portable: residual-skip-tail-sweep (RFC 0030) ---`
- the TC100 Phase 0 H-3 block (Marshal / Psych schema-cache / Thread / fork /
  encoding / resolver divergence)

This also matches the header comment in `unported-files/types.ts`, which
already names the two kinds of exclusion ("pre-1.0 scope" vs
"not-applicable") as the register's own taxonomy.

## Acceptance criteria

- [ ] `unported-files/unscoped.ts` is replaced by a set of modules under
      `unported-files/unscoped/`, one per existing section banner, each
      re-exported and concatenated by `unported-files/index.ts`.
- [ ] No entry gains or loses a `package` field; no reason string is reworded;
      no entry is edited. Mechanical move only.
- [ ] Each new module's JSDoc states that the filename records why the entry is
      excluded and scopes nothing — the absent `package` field is what makes
      these match across every package.
- [ ] The only-shrink `baseline.json` assertion in
      `scripts/parity/unported-files.test.ts` still passes untouched: every
      pre-split entry present, byte-identical, no duplicates.
- [ ] `pnpm parity:api` and `pnpm parity:test` deltas are exactly zero in both
      directions (verify by running both against the branch and against
      restored `main`, as #6340 did).
- [ ] No consumer import changes; the `@blazetrails/parity/unported-files`
      subpath still resolves through `index.ts`.
