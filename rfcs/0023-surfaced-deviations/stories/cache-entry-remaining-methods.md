---
title: "activesupport: port remaining Cache::Entry methods (bytesize, pack/unpack, dup_value!, local?, marshal_load)"
status: in-progress
updated: 2026-06-19
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: 3645
claim: "2026-06-19T14:24:27Z"
assignee: "cache-entry-remaining-methods"
blocked-by: null
---

## Context

PR #3621 ported `Cache::Entry` compression (`entry.rb:25,33-35,76-98`) but the
class is still missing the remaining Rails `Entry` methods. api:compare for
`cache/entry.rb` is at 10/16 (63%); the 6 unported methods are:

- `bytesize` (`entry.rb:60-69`) — size of the cached value; non-String branch
  needs `Marshal.dump(@value).bytesize`.
- `pack` (`entry.rb:114-118`) — `[value, expires_at, version]` with trailing
  nils popped.
- `unpack` (class method, `entry.rb:15-17`) — `new(members[0], expires_at:
members[1], version: members[2])`.
- `dup_value!` (`entry.rb:105-112`) — dup the value unless compressed/Numeric/
  bool; non-String uses `Marshal.load(Marshal.dump(@value))`.
- `local?` (`entry.rb:100-102`) — returns false.
- `marshal_load` (private, `entry.rb:127-130`) — `Marshal.load` wrapped to raise
  `Cache::DeserializationError` on `ArgumentError`.

Rails source: `vendor/rails/activesupport/lib/active_support/cache/entry.rb`
TS file: `packages/activesupport/src/cache/entry.ts`

Note: `bytesize`, `dup_value!`, and `marshal_load` depend on a Marshal
equivalent; see the JSON-for-Marshal deviation story. `local?`, `pack`,
`unpack` are mechanical and can land independently.

## Acceptance criteria

- [ ] `local?`→`isLocal`, `pack`, and static `unpack` ported, matching Rails.
- [ ] `bytesize`, `dupValueBang`, `marshalLoad` ported (or the Marshal-dependent
      parts tracked/blocked on the serialization-fidelity story).
- [ ] api:compare `cache/entry.rb` delta is positive (toward 16/16).
- [ ] No new third-party deps; no direct `node:zlib`.
