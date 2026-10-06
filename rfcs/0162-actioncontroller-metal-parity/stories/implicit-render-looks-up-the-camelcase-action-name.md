---
title: "Implicit render looks up the camelCase action name as the template name"
status: done
updated: 2026-10-06
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: trails#8557
claim: "2026-10-06T00:10:35Z"
assignee: "implicit-render-looks-up-the-camelcase-action-name"
blocked-by: null
closed-reason: null
---

## Context

Rails' `ImplicitRender#default_render` asks `template_exists?(action_name.to_s, _prefixes, ...)` (`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/implicit_render.rb:37-58`), and `ActionView::Rendering#_normalize_options` defaults `options[:template]` to `action_name` (`vendor/rails/v8.0.2/actionview/lib/action_view/rendering.rb`). An action `hello_world` renders `hello_world.html.erb`.

In trails an action is the camelCase method (`helloWorld`), and `defaultRender` (`packages/actionpack/src/action-controller/metal/implicit-render.ts:50,56,85`), `_normalizeOptions` (`packages/actionview/src/rendering.ts:230,237`) and `pickTemplateForEtag` (`packages/actionpack/src/action-controller/metal/etag-with-template-digest.ts:31`) hand that camelCase name to the lookup unchanged. So the implicit template for `helloWorld` is `helloWorld.html.tse`, not `hello_world.html.tse`; the canonical fixtures (`packages/actionpack/src/test-helpers/fixtures/implicit_render_test/empty_action_with_template.html.tse`) are never found, and `metal/implicit-render.trails.test.ts` registers `implicit_render_test/helloWorld.html.html` to get a hit.

The canonical fixtures already follow the camelCase spelling in places (`packages/actionpack/src/test-helpers/fixtures/respond_to/usingDefaults.html.tse`), so the `render_test.rb` ports in `packages/actionpack/src/action-controller/controller/render.test.ts` (trails#8557) name their `FixtureResolver` templates after the camelCase action too: `test/withImplicitTemplate.tse`, `implicit_render_test/helloWorld.tse`, `implicit_render_test/emptyActionWithTemplate.html.tse`, `namespaced/implicit_render_test/helloWorld.tse`, where Rails' are `with_implicit_template.erb`, `hello_world.erb` and `empty_action_with_template.html.erb` (`vendor/rails/v8.0.2/actionpack/test/controller/render_test.rb:8-11,45-48,59-61`).

## Acceptance criteria

- [ ] Decide the one place the Rails action name is recovered for template lookup (the underscored spelling of the camelCase action) and apply it at every site above, so `helloWorld` finds `hello_world.html.tse`.
- [ ] The `render.test.ts` resolvers and `modifyTemplate` calls, and the camelCase files under `test-helpers/fixtures/respond_to/`, are renamed to Rails' snake_case names.
- [ ] `metal/implicit-render.trails.test.ts` registers `implicit_render_test/hello_world.html.html`.
