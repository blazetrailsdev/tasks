---
title: 'Spell the :any variants sentinel as ":any" (Ruby Symbol convention)'
status: in-progress
updated: 2026-10-18
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#9039
claim: "2026-10-18T19:06:54Z"
assignee: "tagged-logging-tagged-awaits-an-async-block"
blocked-by: null
closed-reason: null
---

## Context

Rails spells the "any variant" sentinel as the Symbol `:any`
(`vendor/rails/v8.0.2/actionview/lib/action_view/lookup_context.rb` `detail_args_for_any`,
`details[:variants] = :any`; `template/resolver.rb` / `template_details.rb` compare against `:any`).
By the CLAUDE.md Symbol rule ("A Ruby Symbol is a JS string ... keep the Symbol's leading colon"
where it is compared against other values) trails should spell it `":any"`, but it uses the bare
string `"any"`: `packages/actionview/src/lookup-context.ts:23,133,373`, `path-set.ts:11`,
`template-details.ts:11,20,25,36,52`. The ported `fixture_resolver_test.rb:46`
("should return all variants for any") therefore passes `variants: "any"` in
`packages/actionview/src/template/testing/fixture-resolver.test.ts`, where Rails passes `:any`.

## Acceptance criteria

- The sentinel is `":any"` everywhere it is produced or compared (lookup-context, path-set,
  template-details, resolver types).
- `fixture-resolver.test.ts` passes `variants: ":any"` like Rails.
- actionview tests touching variants stay green.
