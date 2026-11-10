---
title: "Caching tests call fragmentFor directly instead of rbFSend with a literal name"
status: draft
updated: 2026-11-10
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
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

Rails' caching tests call the private helper by a literal Symbol:
`view_context.send(:fragment_for, "expensive") { ... }`
(`vendor/rails/v8.0.2/actionmailer/test/caching_test.rb`, `test_fragment_for`;
`vendor/rails/v8.0.2/actionpack/test/controller/caching_test.rb`, same test) and
`cache_helper.send :fragment_for, "Test fragment name", "Test fragment", &Proc.new { nil }`
(`CacheHelperOutputBufferTest#test_output_buffer` in both files).

The trails ports write these as string-literal sends:
`rbFSend(viewContext, "fragmentFor", "expensive", undefined, () => …)` and
`rbFSend(cacheHelper, "fragmentFor", …)`, in
`packages/actionmailer/test/caching.test.ts` and
`packages/actionpack/test/action-controller/controller/caching.test.ts`.
Root CLAUDE.md § "A dispatch by name is spelled directly" says a send whose
name is a literal is a direct member call with the types discarded.
`fragmentFor` is TS-`private`/`@internal` on `CacheHelper`
(`packages/actionview/lib/helpers/cache-helper.ts`), which is why the send was
used.

## Acceptance criteria

- [ ] Both test files call `fragmentFor` directly, through a typed cast to the
      `CacheHelper` host (e.g. `(viewContext as CacheHelperHost).fragmentFor(...)`),
      with no `rbFSend` and the same arguments.
- [ ] `pnpm parity:api:sends` count for those files does not rise; the tests pass.
