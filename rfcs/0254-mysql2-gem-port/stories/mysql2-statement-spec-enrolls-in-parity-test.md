---
title: "mysql2-statement-spec-enrolls-in-parity-test"
status: done
updated: 2026-11-22
rfc: "0254-mysql2-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 3
pr: trails#10534
claim: "2026-11-21T23:54:33Z"
assignee: "mysql2-parse-ssl-mode-raises-name-error"
blocked-by: null
closed-reason: null
---

## Context

`mysql2-gem-specs-enroll-in-parity-test` (trails PR for the bundle with
`mysql2-client-initialize-option-writers-reach-the-connection`) ported
`vendor/mysql2/0.5.6/spec/mysql2/client_spec.rb`, `error_spec.rb` and `result_spec.rb` to
`packages/mysql2/test/{client,error,result}.test.ts` over the shared
`packages/mysql2/test/spec-helper.ts` (`spec/spec_helper.rb`). `statement_spec.rb` (724 lines,
81 examples) was left out to stay under the PR LOC ceiling.

Surface examples (RFC 0254 § "The measured split": `Statement#execute`, `#affected_rows`, `#close`,
`Result#fields` / `size`): "should let us execute our statement" (`statement_spec.rb:50`),
"should tell us the result count" (`:60`), `#fields` (`:328-343`), `affected_rows` (`:669-708`, which
`USE test`; the CI MariaDB has only `activerecord_unittest`), `close` (`:710-723`), and the
"row data type mapping" block (`:345-640`) that mirrors `result_spec.rb`'s.

## Acceptance criteria

- [ ] `packages/mysql2/test/statement.test.ts` mirrors `statement_spec.rb` with RSpec names unchanged, built on `spec-helper.ts`.
- [ ] Every surface example is ported and green on the MariaDB lane; every other is `it.skip` under a one-line `PERMANENT-SKIP:` (outside the surface, or a CLAUDE.md "Runtime facts" / "A String has no encoding tag either" citation).
- [ ] `pnpm parity:test` delta for `mysql2` is non-negative.
