---
title: "unscope-string-arg-must-raise-argument-error"
status: closed
updated: 2026-09-19
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: 'Subsumed by 0155/unscope-symbol-vs-string-raising-arms (filed 2026-09-19, rehomed from 0132 in this refine), which covers the same defect -- Relation#unscope cannot tell a Ruby Symbol from a String -- and both of its Rails arms: the bare-argument case this story described (default_scoping_test.rb:472-484, test_unscope_errors_with_non_symbol_or_hash_arguments) and the Hash-key case (unscope("where" => :name)) that this story did not. Same parked test, same file; work the fuller story.'
---

## Context

Rails `vendor/rails/activerecord/test/cases/scoping/default_scoping_test.rb:472-484`
(`test_unscope_errors_with_non_symbol_or_hash_arguments`) asserts `unscope("limit")` and
`unscope("select")` (String, not Symbol) raise ArgumentError, as does `unscope(5)`
(`relation/query_methods.rb` `unscope!`: `else raise ArgumentError, "Unrecognized scoping: ..."`).
trails accepts the bare string `"limit"` (Ruby Symbol == JS string), so no error is raised.
Parked as `it.skip` in `packages/activerecord/src/scoping/default-scoping.test.ts` with the
converged body. Cause: string/symbol discrimination (CLAUDE.md: Symbol values carry a leading colon);
not investigated further.

## Acceptance criteria

- Un-skip the test; `unscope("limit")` raises ArgumentError while `unscope(":limit")` works, callers updated.
