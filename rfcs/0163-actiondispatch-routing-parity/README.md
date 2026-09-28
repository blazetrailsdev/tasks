---
rfc: "0163-actiondispatch-routing-parity"
title: "ActionDispatch routing (beyond Journey) — the routing test suites to parity"
status: draft
created: 2026-09-27
updated: 2026-09-27
owner: "@deanmarano"
packages:
  - "actionpack"
clusters: []
---

# RFC 0163 — ActionDispatch routing beyond Journey: the routing test suites to parity

## Summary

This is one of eight actionpack RFCs (0160–0167; RFC 0167 owns measurement fixes
and gate enrollment).

RFC 0139 took `ActionDispatch::Journey` to parity and absorbed RFC 0104's open
mapper and route-set stories; all but two of them are done. What it
deliberately left (its Non-goals) is the routing **test** debt: the
`Mapper` / `RouteSet` / `UrlFor` / `PolymorphicRoutes` / `Redirection` /
`RoutesInspector` suites under `test/dispatch/routing*` and
`test/controller/{routing,resources,url_for*}_test.rb`, which hold the largest
test gap in actionpack — 535 tests across 20 Rails files. This RFC ports them,
and converges the small API and call-set residue on `action_dispatch/routing/**`.

## Motivation

### Measured state, 2026-09-27

trails `main` @ `114cf8364c`, after `pnpm build` and
`API_COMPARE_FORCE=1 pnpm parity:api`.

**API.** Every `action_dispatch/routing/*.rb` row is at 100% except
`routing/mapper.rb` (129/151). All 22 of its missing rows are already filed in
RFC 0141: the `Resource` / `SingletonResource` classes
(`mapper.rb:1164-1305`; `mapper-resources-hand-builds-canonical-routes`,
`mapper-resources-uses-activesupport-inflector`) and
`route_source_locations` / `backtrace_cleaner` / `route_source_location`
(`mapper.rb:26-27,378`; `mapping-make-route-source-location`). One arity row:
`define_generate_prefix(app, name)` (`mapper.rb:670`) takes a third
`mountPath` in trails (`routing/mapper.ts:1522`). Extra surface: `journeyRecognize`
on the invented `routing/journey-bridge.ts`; moved names on `routing/inspector.ts`
(`app`, `inspect`, `verb`), `routing/redirection.ts` (`template`) and
`routing/route-set.ts` (`recognize`). Call baseline rows:
`actiondispatch/routing/polymorphic-routes.json` 4, `routing/redirection.json` 2,
`routing/url-for.json` 1.

**Tests.** 310/845 matched:

| Rails test file                                                                                                                                                                                                     | Rails | OK  | Skip | Wrong describe | Missing |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- | --- | ---- | -------------- | ------- |
| `dispatch/routing_test.rb`                                                                                                                                                                                          | 294   | 154 | 139  | 0              | 1       |
| `controller/routing_test.rb`                                                                                                                                                                                        | 156   | 23  | 37   | 0              | 96      |
| `controller/url_for_integration_test.rb`                                                                                                                                                                            | 87    | 0   | 0    | 0              | 87      |
| `controller/resources_test.rb`                                                                                                                                                                                      | 78    | 0   | 0    | 0              | 78      |
| `controller/url_for_test.rb`                                                                                                                                                                                        | 58    | 52  | 6    | 0              | 0       |
| `dispatch/prefix_generation_test.rb`                                                                                                                                                                                | 45    | 24  | 21   | 45             | 0       |
| `dispatch/url_generation_test.rb`                                                                                                                                                                                   | 37    | 20  | 17   | 37             | 0       |
| `dispatch/routing/inspector_test.rb`                                                                                                                                                                                | 31    | 15  | 16   | 0              | 0       |
| `dispatch/mapper_test.rb`                                                                                                                                                                                           | 21    | 12  | 9    | 0              | 0       |
| `dispatch/routing/concerns_test.rb`                                                                                                                                                                                 | 11    | 10  | 1    | 0              | 0       |
| `dispatch/mount_test.rb`                                                                                                                                                                                            | 10    | 0   | 0    | 0              | 10      |
| `dispatch/routing/custom_url_helpers_test.rb`                                                                                                                                                                       | 8     | 0   | 0    | 0              | 8       |
| 8 one-test files (`controller/api/url_for`, `default_url_options_with_before_action`, `route_helpers`; `dispatch/routing/{instrumentation,ipv6_redirect,log_subscriber,non_dispatch_routed_app}`; `routing/helper`) | 8     | 0   | 0    | 0              | 8       |

Three shapes dominate:

- **Empty skip stubs.** 246 tests are `it.skip("name", () => {})` — matched by
  name, credited nothing (e.g. `dispatch/routing.test.ts:1345-1347`).
- **Wrong describe.** `prefix_generation` and `url_generation` wrap their Rails
  classes in the enclosing Ruby module (`TestGenerationPrefix::WithMountedEngine`),
  where the extractor records the class alone (`WithMountedEngine`). 82 tests.
- **Wrong test name.** `controller/resources.test.ts` spells all 78 names as the
  raw Ruby method (`it("test_irregular_id_with_no_constraints_should_raise_error")`);
  `extract-ruby-tests.rb:691` derives `"irregular id with no constraints should raise error"`.
  The file is also 460 lines against Rails' 1471, so the bodies are thin.

## Design

### Order behind RFC 0139's last stories

`route-set-recognize-routing-test-rewrite-and-delete` (0139, in progress)
rewrites `dispatch/routing.test.ts`'s 266 `routes.recognize` call sites onto
Rails' seats. Every story that edits that file depends on it, so the rewrite
lands once. `port-mapping-initialize-and-make-route` (rehomed to RFC 0123 on
2026-09-27, blocked on
`mapper-resources-hand-builds-canonical-routes`) finishes `Mapping#initialize`;
the resources stories depend on the 0141 story that unblocks it.

### Skip stubs are ported, not deleted

An empty skip stub is a placeholder that says "Rails has this test". The story
that owns a file replaces every stub with the Rails body. A test that exposes a
port bug stays skipped only with the id of the story that fixes the bug.

### Re-spelling to the extractor's name is convergence

The same argument RFC 0139 made for Journey: `it("test_foo")` is not the Rails
name, `"foo"` is. The same goes for the describe path. Nothing is reworded.

### Prior art folded in by reference

| Story                                                                                                                                                                                                             | RFC  | Bearing                                                            |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- | ------------------------------------------------------------------ |
| `route-set-recognize-routing-test-rewrite-and-delete`                                                                                                                                                             | 0139 | Rewrites `routing.test.ts`; a dependency                           |
| `port-mapping-initialize-and-make-route`                                                                                                                                                                          | 0123 | `Mapping#initialize` (blocked)                                     |
| `mapper-resources-hand-builds-canonical-routes`                                                                                                                                                                   | 0141 | `Resource` / `SingletonResource`; the resources tests depend on it |
| `mapper-resources-uses-activesupport-inflector`                                                                                                                                                                   | 0141 | `resources :people`                                                |
| `mapping-make-route-source-location`                                                                                                                                                                              | 0141 | `route_source_locations`; the inspector tests depend on it         |
| `port-url-for-integration-test`                                                                                                                                                                                   | 0141 | All 87 `url_for_integration_test.rb` tests — not restated          |
| `route-set-static-route-leaks-controller-action-into-query`                                                                                                                                                       | 0141 | `url_for` on static routes                                         |
| `mapper-add-route-name-option-alias`, `mapper-route-dsl-ignores-on-option`, `mapper-scope-include-enumerable-drop-symbol-iterator`, `mapping-build-conditions-public-method-defined`                              | 0141 | Mapper DSL arms the ported tests will exercise                     |
| `url-for-concern-included-block`, `url-for-is-a-plain-object-module-not-a-linkable-module`, `url-for-parameters-keys-cross-into-camelcase-options`, `url-for-module-private-initialize-and-url-for-modules-order` | 0141 | `Routing::UrlFor`                                                  |
| `converge-journey-mapping-onto-ported-mapper-mapping`                                                                                                                                                             | 0023 | `Mapping`                                                          |

## Non-goals

- **Journey** (`action_dispatch/journey/**`) — RFC 0139.
- **`controller/url_for_integration_test.rb`** — RFC 0141's
  `port-url-for-integration-test`; counted above so the RFC's total is honest.
- **`dispatch/routing_assertions_test.rb`** — RFC 0160 (test harness)
  (`ActionDispatch::Assertions::RoutingAssertions`).

## Alternatives considered

- **One story per Rails test file.** `dispatch/routing_test.rb` alone is 5393
  lines with 139 skips; it splits by Rails line range, like RFC 0139 split the
  Journey router tests.

## Rollout

1. API — `routing-invented-surface-and-generate-prefix-arity`,
   `routing-call-baselines-to-zero`
2. `dispatch/routing_test.rb` — `port-routing-test-mapper-skips-part-1`,
   `port-routing-test-mapper-skips-part-2`,
   `port-routing-test-mapper-skips-part-3`,
   `port-routing-test-alt-app-through-route-defaults-skips`,
   `port-routing-test-generation-errors-through-relative-root-skips`
3. `controller/routing_test.rb` —
   `port-controller-routing-test-legacy-route-set-part-1`,
   `port-controller-routing-test-legacy-route-set-part-2`,
   `port-controller-routing-test-route-set-part-1`,
   `port-controller-routing-test-route-set-part-2-and-rack-mount`
4. Resources and generation — `port-resources-test-part-1`,
   `port-resources-test-part-2`,
   `port-prefix-and-url-generation-tests`,
   `port-routes-inspector-test-skips`,
   `port-mapper-and-concerns-test-skips`,
   `port-mount-and-custom-url-helpers-tests`,
   `port-small-routing-and-url-for-test-files`
5. Close — `routing-parity-residue`

## Verification

- `pnpm parity:api --package actiondispatch` reports every
  `action_dispatch/routing/*.rb` row at 100% (with RFC 0141's mapper stories
  landed) and no routing arity row.
- `pnpm parity:api:extra --package actiondispatch` lists no file under
  `routing/`; `routing/journey-bridge.ts` no longer exists.
- No row remains under `call-mismatches-exclude/actiondispatch/routing/`.
- `pnpm parity:test` reports every file in the tests table with 0 skipped,
  0 missing and 0 wrong describe.

## Open questions

None.

## Changelog

- 2026-09-27: initial RFC
