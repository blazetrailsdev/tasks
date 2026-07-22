---
title: "Sweep arel for Rails-named placeholder tests that assert nothing and inflate test:compare"
status: done
updated: 2026-07-22
rfc: "0066-arel-visitor-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: 54
pr: 5056
claim: "2026-07-22T14:26:58Z"
assignee: "arel-tests-rails-named-placeholder-bodies-inflate-test-compare"
blocked-by: null
closed-reason: null
---

## Context

PR #5029 found that `select-manager.test.ts`'s `join` and `outer join`
describe blocks carried Rails' verbatim test names over bodies that asserted
nothing about joins:

```ts
describe("join", () => {
  it("takes a class", () => {
    // In Rails, SelectManager can take a class. We take a Table.
    const mgr = new SelectManager(users);
    expect(mgr).toBeInstanceOf(SelectManager); // passes for ANY impl
  });
});
```

Three such placeholders existed (`takes a class`, `noops on nil`, plus a
duplicated `responds to join`). They are why the `String`/`SqlLiteral`
divergence in `SelectManager#join` survived #5025's `Table#join` convergence:
`test:compare` counted the tests as matched, so the file read as 110/113
covered while the join path was actually untested. PR #5029 converged those
specific blocks to Rails' real assertions (110 → 111 matched).

This is a **detection** gap, not a one-off: any Rails-named test whose body is
`expect(x).toBeInstanceOf(SomeClass)` or `expect(x).toHaveProperty("name")`
inflates `test:compare` while asserting nothing. Other arel test files likely
carry the same pattern.

## Acceptance criteria

- Sweep `packages/arel/src/**/*.test.ts` for Rails-named tests whose bodies
  assert only tautologies — `toBeInstanceOf` on a constructor just called,
  `toHaveProperty` on a method name, or a bare `not.toThrow()` where the Rails
  original asserts SQL.
- Report the inventory (file + test name + the Rails `file:line` it claims to
  mirror). This may be audit-only if the count is large — split the fixes into
  follow-up stories rather than one mega-PR.
- Converge the placeholders found to Rails' real assertions. Test names must
  NOT change (they are `test:compare`'s matching key).
- `test:compare` delta stays non-negative; expect matched counts to move as
  fake passes become real ones.
- Consider whether a lint could flag the pattern automatically — a
  Rails-matched test whose assertions never reference `toSql()` or the node
  under test is a reasonable heuristic.
