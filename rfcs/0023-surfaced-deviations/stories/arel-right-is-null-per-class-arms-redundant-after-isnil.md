---
title: "rightIsNull's per-class Casted/Quoted arms are dead after isNil() landed"
status: ready
updated: 2026-07-15
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by review of PR #4874 (arel-attribute-quoted-node-nil-builds-casted),
and only became true once that PR merged — it is not a pre-existing deviation,
it is newly-created redundancy.

Rails' equality visitors guard with a bare `right.nil?` (`to_sql.rb:649`).
`Casted#nil?` (`casted.rb:15`) and `Quoted#nil?` (`casted.rb:41`) are each
`value.nil?`, so Ruby needs no per-class arms — the polymorphic `nil?` call
covers every wrapper.

`ToSql#rightIsNull` (`packages/arel/src/visitors/to-sql.ts:2165-2179`) still
carries two explicit per-class arms:

```ts
if (right === null || right === undefined) return true;
if (right instanceof Nodes.Quoted && right.value === null) return true; // 2173
if (right instanceof Nodes.Casted && right.value === null) return true; // 2174
const maybe = right as { isNil?: () => boolean };
return typeof maybe?.isNil === "function" && maybe.isNil(); // 2178-2179
```

Lines 2173-2174 were added by #4873 when neither node had an `isNil()`. #4874
then ported Rails' `nil?` onto both (`casted.ts` — `Casted#isNil`,
`Quoted#isNil`), so the duck-typed arm on 2178-2179 now subsumes both: any
`Casted`/`Quoted` with a null value answers `isNil()` true and returns via the
last line. The two `instanceof` arms are dead weight and are strictly NARROWER
than the arm below them (they test `value === null` only, while `isNil()` also
covers `undefined`) — so they can be deleted without changing any behavior,
leaving a single polymorphic check that reads like Rails' `right.nil?`.

Deleting them is what makes the TS mirror the Ruby: one `nil?` dispatch rather
than a type switch. Verify the `right === null || right === undefined` bare-nil
arm on 2172 stays — it has no Rails analogue in `rightIsNull` (Ruby's `nil.nil?`
is just true) and is trails' way of handling a raw nil that never got wrapped.

Was deliberately left out of #4874 to avoid conflicting with #4873, which was
open on this same file at the time; both are now merged, so the coast is clear.

## Acceptance criteria

- [ ] `rightIsNull` drops the two `instanceof Nodes.Quoted` /
      `instanceof Nodes.Casted` arms (`to-sql.ts:2173-2174`), relying on the
      duck-typed `isNil()` call to mirror Rails' single `right.nil?`
      (`to_sql.rb:649`).
- [ ] The comment block above is updated — it currently explains the per-class
      arms it justifies.
- [ ] No SQL changes: `IS NULL` / `IS NOT NULL` still render for
      `eq(null)`/`notEq(null)`, `Casted(null)`, `Quoted(null)`,
      `Casted(undefined)`, `Quoted(undefined)`, and null-serializing binds.
      Existing coverage lives in `packages/arel/src/nodes/casted.test.ts`
      ("Arel::Nodes::Casted#nil?") and the Rails-mapped "should handle nil"
      tests in `attributes/attribute.test.ts`.
- [ ] api:compare / test:compare delta non-negative; wide ratchet green.
