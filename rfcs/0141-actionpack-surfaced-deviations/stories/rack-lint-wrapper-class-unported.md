---
title: "rack-lint-wrapper-class-unported"
status: draft
updated: 2026-10-21
rfc: "0141-actionpack-surfaced-deviations"
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
closed-reason: null
---

## Context

`Rack::Lint#call` is `Wrapper.new(@app, env).response`
(`vendor/rack/v3.1.14/lib/rack/lint.rb:40-42`), and `Wrapper#response`
(`lint.rb:60-96`) returns `[@status, @headers, self]`: the wrapper IS the body,
answering `each` (`:836-902`), `to_path` (`:906-908`), `respond_to?` over
`BODY_METHODS` (`:904`, `:910-916`), `to_ary` (`:926-934`), `call(stream)`
(`:939-957`) and `close` (`:820-835`), plus `verify_to_path` /
`verify_content_length` and the `rack.lint` / `rack.lint.body_iteration` env
bookkeeping.

trails: `packages/rack/src/lint.ts` has no `Wrapper` class. `Lint#call` runs the
checks inline and `wrapBody` (`lint.ts:250-252`) returns the body unchanged, so
no body-protocol check runs. Lint is used by ~15 actionpack dispatch test files
(`grep -rl Lint packages/actionpack/src`), each of which will then see the
wrapper as its body and must close it.

## Acceptance criteria

- [ ] `Lint.Wrapper` is ported with Rails' constructor ivars and `response`;
      `Lint#call` is `new Wrapper(this.app, env).response()`.
- [ ] The wrapper is returned as the body and ports `each`, `toPath`,
      `isRespondTo` (BODY_METHODS), `call`, `close`, `verifyToPath`,
      `verifyContentLength` with Rails' `LintError` messages; it also answers
      `Symbol.asyncIterator` per CLAUDE.md § "`$!` is passed explicitly, and a
      response body is iterated async".
- [ ] `wrapBody` is deleted.
- [ ] actionpack tests that go through Lint still pass (closing the body where
      Rails' tests do).
