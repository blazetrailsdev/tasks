---
title: "Row-write lint does not see it.each table bodies"
status: done
updated: 2026-08-05
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: 6114
claim: "2026-08-05T02:30:05Z"
assignee: "refresh-stale-eslint-exclude-baselines"
blocked-by: null
closed-reason: null
---

## Context

`rowWritesAtItScope` in `scripts/non-transactional-row-writes.ts` (added by
PR #6108) tracks it-scope by the `it(` / `test(` call's own parenthesis depth,
which covers both a braced callback and a brace-less arrow body. It does not
cover the table form:

```ts
it.each([...])("name", async (row) => {
  await Book.create({ name: row.name });
});
```

`IT_CALL` matches `it.each(`, so the pushed paren is the one closing the table
argument — it closes before the body call even starts, and every write in that
body is invisible to the lint. The gap is documented in the function's JSDoc
and was accepted by review as low severity, since the lint is a human-reviewed
ratchet rather than a hard gate.

It is still exactly the class of file the lint exists to catch: a `.each` table
of cases writing rows with no transactional wrap leaks between cases the same
way `encryption/encryptable-record.test.ts` did in #5719, and the failure can be
lane-specific.

## Converged shape

Recognize the `it.each([...])(...)` / `test.each` shape: after the table call's
parens close, the immediately-following `(` opens the body call, so the scope
push belongs there rather than on the `it.each(` paren. Template-literal table
forms (`` it.each`...` ``) should be handled or explicitly excluded.

Reseed the ratchet from the tree afterwards. Any file the widened lint newly
flags either takes the Rails shape or is added to the ratchet with the reseed —
this is the initial-seed case, not a widening of an existing allowlist.

## Acceptance criteria

- [ ] A write inside an `it.each([...])("name", fn)` body is reported.
- [ ] The `it.each` note is removed from `rowWritesAtItScope`'s JSDoc, or
      narrowed to whatever genuinely remains uncovered.
- [ ] Regression tests for the table form alongside the existing brace-less and
      destructuring-before-arrow cases.
- [ ] `scripts/non-transactional-row-writes.json` reseeded and its test green.
