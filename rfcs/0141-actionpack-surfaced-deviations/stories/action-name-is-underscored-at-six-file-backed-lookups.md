---
title: "actionpack: the action name is underscored at six file-backed lookups Rails passes it to unchanged"
status: closed
updated: 2026-10-07
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: ["actionpack", "actionview", "trailties"]
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: trails#8654
claim: "2026-10-07T19:07:44Z"
assignee: "action-name-is-underscored-at-six-file-backed-lookups"
blocked-by: null
closed-reason: "ratified per owner (trails#8654): template file names and lazy locale keys are the action's name in kebab-case; the conversion at the six sites stays, in that spelling. Not converged onto Rails."
---

## Context

trails#8640 (owner-ratified, CLAUDE.md "An action's name is its method's name") leaves one place
where an action is known by Rails' spelling: the file-backed lookups. A template is found as
`next_bundle.html.erb` and a lazy locale key as `controller.next_bundle.title` for the action
`nextBundle`, through `underscore` at six call sites, each `@inventedArm underscore — PERMANENT`:

- `ImplicitRender#defaultRender`, `#methodForAction` (`packages/actionpack/src/action-controller/metal/implicit-render.ts`; Rails `actionpack/lib/action_controller/metal/implicit_render.rb:38-64` passes `action_name` unchanged)
- `EtagWithTemplateDigest#pickTemplateForEtag` (`metal/etag-with-template-digest.ts`; `metal/etag_with_template_digest.rb`)
- `ActionView::Rendering#_processRenderTemplateOptions` (`packages/actionview/src/rendering.ts`; `actionview/lib/action_view/rendering.rb` `_process_render_template_options`)
- `AbstractController::Translation#translate` (`abstract-controller/translation.ts`; `abstract_controller/translation.rb`)
- `RouteInfo#viewPath` (`packages/trailties/src/commands/unused-routes.ts`; `railties/lib/rails/commands/unused_routes/unused_routes_command.rb`)
- and `trails-tsc`'s `build-views.ts`, which mirrors the rule at compile time.

Rails makes none of those calls: there the action name is already the file's name. The owner was
asked whether templates and locale keys should also follow the method's spelling and had not
answered when #8640 merged.

## Converged shape

Rails' shape is "the action name is passed to the lookup unchanged". Under the one-spelling rule
that is reachable only if a TS application's template and locale key are spelled as the action is
(`nextBundle.html.tse`, `controller.nextBundle.title`), which removes all six `underscore` calls
and their receipts. What stands in the way is the vendored fixture tree and Rails-named views,
which are underscored.

## Acceptance criteria

- [ ] The owner's decision is recorded here: files follow the action's spelling, or they stay Rails-spelled.
- [ ] If they follow: the six sites pass `action_name` unchanged as Rails does, the receipts are deleted, and the fixtures the ported tests render are renamed or resolved by one documented rule.
- [ ] If they stay: this story is closed with that reason, and the CLAUDE.md section is the record.
