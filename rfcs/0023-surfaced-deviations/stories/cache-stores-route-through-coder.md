---
title: "activesupport: route cache stores (FileStore/MemoryStore/entry-record) through fidelity Coder"
status: done
updated: 2026-06-20
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 3677
claim: "2026-06-19T21:54:11Z"
assignee: "cache-stores-route-through-coder"
blocked-by: null
---

## Context

`cache-serialization-marshal-vs-json` (PR #3648) introduced a fidelity-preserving
`coder` (`packages/activesupport/src/cache/coder.ts`) and routed `Cache::Entry`
serialization (`compressed`/`uncompress`/`bytesize`/`dupValueBang`/`marshalLoad`)
through it. The concrete stores were left out of scope and still use ad-hoc JSON:

- `cache/file-store.ts` — `JSON.stringify`/`JSON.parse` for on-disk entries.
- `cache/memory-store.ts` — deep-clones via `JSON.parse(JSON.stringify(value))`
  on read and stores plain objects.
- `cache/entry-record.ts` — the `CacheEntry` plain-object shape these stores use.

These paths lose the exact fidelity the Coder fixes (Date → ISO string, undefined
dropped/null-ified, bigint throws, NaN/±Infinity → null), so a value written
through a store does not round-trip like one through `Entry`.

## Acceptance criteria

- [ ] FileStore and MemoryStore serialize/deserialize (and MemoryStore's
      defensive deep-clone) through `cache/coder.ts`, not raw JSON.
- [ ] entry-record aligns with the Coder-backed representation.
- [ ] Round-trip fidelity (Date/undefined/bigint/non-finite) holds for values
      written and read back through each store.
