---
title: "Widen Relation#except/Querying#except skip type to accept arbitrary strings"
status: claimed
updated: 2026-06-24
rfc: "0045-data-layer-api-compare-100"
cluster: null
deps:
  - ar-querying-async-finders
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: "2026-06-24T12:01:15Z"
assignee: "ar-except-skip-key-widen-string"
blocked-by: null
---

## Context

`Relation#except` (relation.ts, converged in PR #4052) and the `Querying#except`
delegator (querying.ts, PR #4050) type skips as the finite `ExceptKey` union.
Rails `except(*skips)` (spawn_methods.rb:59-60) does a bare `values.except(*skips)`
that accepts ANY key — unknown ones are a silent no-op. Copilot review on #4050
flagged that `Post.except("bogus")` should typecheck (no cast) while only
recognized stored value keys have an effect.

## Acceptance criteria

- Widen the `except` skip parameter to accept arbitrary strings while keeping
  `ExceptKey` autocomplete (e.g. `ExceptKey | (string & {})`), on both
  `Relation#except` and the `Querying#except` delegator.
- Unrecognized keys remain a runtime no-op (already the case).
- `Post.except("bogus")` typechecks without a cast; add/keep a test asserting the
  no-op behavior. api:compare querying.ts stays 100%.
