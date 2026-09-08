---
title: "Port the 12 remaining TemplateDigestorTest tests (logging, variants, format fallback, caching-off)"
status: draft
updated: 2026-09-08
rfc: "0140-actionview-rendering-core"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR 7628 ported 29 of the 41 tests in
`vendor/rails/actionview/test/template/digestor_test.rb` into
`packages/actionview/src/template/digestor.test.ts`. `pnpm parity:test` reports
`template/digestor_test.rb -> template/digestor.test.ts  29 0 0 0 12 0 41`.

The 12 unported tests are the ones needing harness affordances the in-memory
`FixtureResolver` setup does not have yet:

- `test_logging_of_missing_template`,
  `test_logging_of_missing_template_ending_with_number`,
  `test_logging_of_missing_template_for_dependencies`,
  `test_logging_of_missing_template_for_nested_dependencies` (`:98-124`) — need
  the `assert_logged` helper, i.e. a capturing logger installed on
  `ActionView::Base.logger`, which `Digestor.logger` reads through the base
  slot.
- `test_variants` (`:257-262`) — needs `finder.variants =` plus a
  `messages/new.html+iphone.tse` fixture; the Rails helper writes the variant
  suffix in `change_template`.
- `test_template_formats_of_nested_deps_with_non_default_rendered_format`,
  `test_template_formats_of_dependencies_with_same_logical_name_and_different_rendered_format`
  (`:153-160`) — need `tree_template_formats`, which reads `node.template.format`
  over `tree.flatten`; Rails defines `Node#flatten` in the test file itself
  (`:17-21`).
- `test_template_dependencies_with_fallback_from_js_to_html_format`,
  `test_template_digest_with_fallback_from_js_to_html_format` (`:162-171`) —
  need the `comments/show.js.tse` fixture and js->html format fallback.
- `test_nested_template_deps_with_non_default_rendered_format` (`:148-151`) —
  needs `messages/thread.json.tse` under the `digestor/api` view path.
- `test_details_are_included_in_cache_key` (`:216-229`) — needs two finders
  built with different `formats` details.
- `test_digest_cache_cleanup_with_recursion_and_template_caching_off`,
  `test_explicit_dependency_wildcard_picks_up_added_file` /
  `..._removed_file` in their Rails form (`:59-73`, `:311-319`) — need
  `disable_resolver_caching`, i.e. `ActionView::Resolver.caching = false`.

## Converged shape

Port all 12 with Rails' names verbatim, extending the existing describe's
private helpers to match Rails' own (`assert_logged`, `tree_template_formats`,
`disable_resolver_caching`, and `change_template`'s variant suffix) rather than
inventing new ones. `Node#flatten` is defined on the test side in Rails, so it
belongs in the test file here too, not on `Node`.

Add the missing fixtures from `vendor/rails/actionview/test/fixtures/digestor/`
under their `.tse` names: `comments/show.js.tse`, `messages/thread.json.tse`,
`messages/new.html+iphone.tse`, and the `api/` pair.

## Acceptance criteria

- [ ] `pnpm parity:test` reports 41/41 for `template/digestor_test.rb` with 0
      missing.
- [ ] Test names match Rails verbatim; no name is reworded to fit the harness.
- [ ] `pnpm parity:test:assertions` stays green.
- [ ] No bespoke fixture invented — every template body comes from
      `test/fixtures/digestor/`.
