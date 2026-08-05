---
title: "Row-write lint does not see it.each tagged-template tables"
status: done
updated: 2026-08-05
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 6126
claim: "2026-08-05T12:15:04Z"
assignee: "datetime-new-start-preserves-the-receiver"
blocked-by: null
closed-reason: null
---

## Context

`rowWritesAtItScope` (`scripts/non-transactional-row-writes.ts`) covers the
braced body, the brace-less arrow body and — since PR #6114 — the
`it.each([...])("name", fn)` table form, whose body lives in a second call.

The tagged-template table form is still uncovered:

```ts
it.each`
  name      | count
  ${"Dune"} | ${1}
`("writes $name", async ({ name }) => {
  await Book.create({ name });
});
```

`IT_CALL` requires a `(` after the callee, so `` it.each` `` never matches at
all. The deeper blocker is `stripCommentsAndStrings`, which strips `'…'` and
`"…"` but not template literals, so parens inside a table cell would be counted
as code and desynchronise `parenDepth` for the rest of the file. The gap is
named in the function's JSDoc. No file in the tree uses this form today.

## Converged shape

Teach `stripCommentsAndStrings` to blank template-literal contents (preserving
newlines so line numbers survive, and handling `${…}` interpolation), then match
`` (it|test)(\.\w+)*\s*` `` and push the it-scope on the `(` that follows the
template's closing backtick — the same deferral the `it.each(` table form uses.

## Acceptance criteria

- [ ] A write inside an ``it.each`…`("name", fn)`` body is reported.
- [ ] Parens inside a template literal do not shift `parenDepth`.
- [ ] The remaining-gap note leaves `rowWritesAtItScope`'s JSDoc.
- [ ] Ratchet test stays green with no reseed, or reseeds with the initial-seed
      rationale recorded.
