---
title: "Port controller/routing_test.rb's last RouteSetTest test and RackMountIntegrationTests"
status: in-progress
updated: 2026-10-14
rfc: "0163-actiondispatch-routing-parity"
cluster: null
packages: ["actionpack"]
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: trails#8892
claim: "2026-10-14T11:42:29Z"
assignee: "dirty-getters-with-side-effects-exclusion-has-no-receipt"
blocked-by: null
closed-reason: null
---

## Context

`port-controller-routing-test-route-set-part-2-and-rack-mount` shipped 36 of
its 42 tests and stopped at the PR LOC ceiling. Six tests of
`vendor/rails/v8.0.2/actionpack/test/controller/routing_test.rb` remain:

- `RouteSetTest#test_generate_with_optional_params_recalls_last_request`
  (`:1947-1992`), the last test of the class.
- `RackMountIntegrationTests` (`:1996-2196`): `test_recognize_path`,
  `test_generate_extras`, `test_extras`, `test_unicode_path`,
  `test_downcased_unicode_path`.

All six were written and passing before the cut. What the port needs:

- `Mapping` (`:2001-2057`) calls `resources :users, :posts`.
  `Mapper#resources` in `packages/actionpack/src/action-dispatch/routing/mapper.ts`
  takes one `name`, where Rails takes `*resources, &block` and reads
  `options = resources.extract_options!.dup`
  (`actionpack/lib/action_dispatch/routing/mapper.rb:1518-1522`). Converge the
  signature to a rest parameter: pop the trailing block, `extractOptionsBang`
  the options, hand the whole list to `applyCommonBehaviorFor`, and
  `resources.pop` the name after it, as Rails does. `Mapper#resource`
  (`mapper.rb:1349`) has the same one-name signature.
- `via: :all` is `via: ":all"`: `VerbMatchers.VERB_TO_CLASS` in
  `journey/route.ts` keys `All` by the Symbol spelling, and `"all"` builds an
  `Unknown` matcher that matches nothing.
- `@routes.recognize_path(nil)` (`:2139`): `RouteSet#recognizePath` types
  `path` as `string` while its body already handles `null`. Widen the type.
- The `/x` patterns (`:2037-2041`) have no JS flag. Write the pattern without
  its whitespace and comments.
- `URI::RFC2396_PARSER.escape` is ruby-compat's `RFC2396_PARSER.escape`.
- `sort_extras!` (`:2190-2195`) is a private helper of the test class.

## Acceptance criteria

- [ ] The six tests are ported in Rails order under their Rails classes.
- [ ] `Mapper#resources` takes Rails' `*resources` list.
- [ ] `pnpm parity:test --package actioncontroller` reports
      `controller/routing_test.rb` 156/156 with 0 skipped.
