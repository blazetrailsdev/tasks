---
title: "fixture_set/file_test.rb: render context lookup scope is still excluded"
status: claimed
updated: 2026-10-12
rfc: "0175-activerecord-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: "2026-10-12T13:52:25Z"
assignee: "activerecord-port-pool-tests-blocked-on-enumerator-interlock-and-sync-new-connection"
blocked-by: null
closed-reason: null
---

## Context

`FixtureSet::FileTest#test_render_context_lookup_scope`
(`vendor/rails/v8.0.2/activerecord/test/cases/fixture_set/file_test.rb:97-116`) is the one
`fixture_set/file_test.rb` case still excluded in
`scripts/parity/unported-files/unscoped.ts`. Its template evaluates
`defined? ActiveRecord`, `defined? ActiveRecord::FixtureSet`, `defined? FixtureSet`,
`defined? ActiveRecord::FixtureSet::File` and `File.name`, and asserts that the rendering
context sees top-level constants but not `FixtureSet` unqualified. That holds because
`RenderContext` is defined in compact style
(`vendor/rails/v8.0.2/activerecord/lib/active_record/fixture_set/render_context.rb:5-7`).

In trails a fixture template is compiled by `ConfigurationFile#render`
(`packages/activesupport/src/configuration-file.ts`) into a `with (__binding)` function, so
a bare name resolves against the binding and then `globalThis`. trails seats constants on
`TopLevel` / namespace objects, not on `globalThis`, so `ActiveRecord` is a `ReferenceError`
in a template and the golden cannot hold as written. trails#8801 left the row in place.

## Acceptance criteria

- [ ] Decide the converged shape with the repo owner: either the render context resolves a
      bare constant name through the top-level constant table (so the Rails golden holds
      with `defined?` spelled as its TS analogue), or the row is ruled permanent and its
      reason starts `PERMANENT:` citing the ratifying CLAUDE.md section.
- [ ] If converged, the case is ported in `fixture-set/file.test.ts` with Rails' body and the
      `unscoped.ts` row is deleted.
