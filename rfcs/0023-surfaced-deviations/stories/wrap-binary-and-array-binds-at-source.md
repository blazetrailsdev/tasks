---
title: "Wrap binary/array binds in Data at the source so type_cast needs no bare-JS arms"
status: draft
updated: 2026-07-20
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by #4998 (`type-casted-binds-payload-self-dispatch`), which had to add
two arms to `type_cast` that Rails does not have.

Rails only ever reaches `type_cast` with **wrapped** values — `Type::Binary::Data`
(`abstract/quoting.rb:96`) and `OID::Array::Data`
(`postgresql/quoting.rb:213`) — because its type layer wraps them on the way
out of `serialize`. Its cast chain therefore has no arm for the bare form, and
its final `raise` is unreachable for these types.

trails' bind paths carry the **unwrapped** JS analogue, so once #4998 routed
those paths through the adapter's `type_cast`, both raised:

- `can't cast Uint8Array` — mysql2 binds a binary column as a bare
  `Uint8Array`, not a `BinaryData`.
- `can't cast Array` — a bare JS Array on PG's `execute(sql, binds)` path.

PR #4998 fixed the symptom by adding arms at the `rb:96` position in
`abstract/quoting.ts:187-195`, `mysql/quoting.ts:280-284` and
`postgresql/quoting.ts:254`. Those arms are correct and tested, but they are
trails-only surface area: the underlying deviation is that our serializers emit
bare values where Rails emits a wrapper. Converging at the source would let all
three arms be deleted.

Both bugs were invisible on SQLite and only appeared when the PG/MySQL suites
were run — see the memory note
`project_typecast_raises_on_bare_js_analogues_of_ruby_wrappers`.

## Acceptance criteria

- [ ] Identify which serializers emit a bare `Uint8Array` / JS `Array` where
      Rails emits `Type::Binary::Data` / `OID::Array::Data`, and wrap at the
      source.
- [ ] The bare-value arms added by #4998 are deleted once nothing reaches them,
      leaving the chain arm-for-arm with Rails.
- [ ] `binary.trails.test.ts` and `adapters/postgresql/array.test.ts` pass
      unchanged on all three adapters, plus mysql2's binary bind path.
- [ ] If a bare form must survive at some boundary (e.g. a driver contract that
      cannot accept the wrapper), document which and why rather than deleting
      the arm.
