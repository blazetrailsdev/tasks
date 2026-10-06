---
title: "The action name is underscored at each template lookup site instead of being Rails' name"
status: in-progress
updated: 2026-10-06
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: trails#8573
claim: "2026-10-06T13:39:34Z"
assignee: "action-name-is-underscored-at-each-template-lookup-site"
blocked-by: null
closed-reason: null
---

## Context

Rails hands `action_name` to template lookup unchanged: `template_exists?(action_name.to_s, _prefixes, ...)` and `any_templates?(action_name.to_s, _prefixes)` (`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/implicit_render.rb:38,40`), `method_for_action`'s `template_exists?(action_name.to_s, _prefixes)` (`:60-64`), `options[:template] ||= (options[:action] || action_name).to_s` and `options[:partial] = action_name` (`vendor/rails/v8.0.2/actionview/lib/action_view/rendering.rb`, `_process_render_template_options`), and `EtagWithTemplateDigest#pick_template_for_etag` (`action_controller/metal/etag_with_template_digest.rb`).

A trails action is the camelCase JS method (`helloWorld`), so trails#8557 wrapped the name in `underscore(...)` at each of those sites (`packages/actionpack/src/action-controller/metal/implicit-render.ts`, `metal/etag-with-template-digest.ts`, `packages/actionview/src/rendering.ts`) so `helloWorld` finds `hello_world.html.tse`. That is a call Rails does not make, at six sites, with no call-site receipt, and it is uneven: `render({ action: "helloWorld" })` is underscored while `render("helloWorld")` (a template string) is not. Other `actionName` consumers were not swept: `layouts.ts`'s `only:` / `except:` conditions, `abstract-controller/translation.ts`'s lazy-lookup scope (`"#{path}.#{action_name}#{key}"`), `caching.ts`'s fragment key, and the instrumentation payload all still carry the camelCase name where Rails carries `hello_world`.

## Acceptance criteria

- [ ] Decide one seat for the Rails spelling. The converged shape is that `action_name` itself is the Rails name (`hello_world`) and `method_for_action` (`vendor/rails/v8.0.2/actionpack/lib/abstract_controller/base.rb`) is where it becomes the JS method name, so every site above passes `actionName` unchanged, as Rails does.
- [ ] The six `underscore(...)` calls trails#8557 added are gone, or each carries a receipt naming this story.
- [ ] `layouts`, `translation`, `caching` and the `process_action.action_controller` payload see the same name Rails' would.
