---
title: "ActionView trailtie: port railtie.rb:74-80 config.action_view send loop"
status: draft
updated: 2026-09-26
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails applies every `config.action_view.*` key to `ActionView::Base` in one
`after_initialize` (`vendor/rails/v8.0.2/actionview/lib/action_view/railtie.rb:74-80`):

```ruby
config.after_initialize do |app|
  ActiveSupport.on_load(:action_view) do
    app.config.action_view.each do |k, v|
      send "#{k}=", v
    end
  end
end
```

trails' `packages/trailties/src/trailties/action-view.ts` has no such loop. Instead
it has an invented `action_view.annotate_rendered_view_with_filenames`
initializer that copies one key onto `Base`. So `config.actionView.cacheTemplateLoading`
never reaches `Base.cacheTemplateLoading` (`base.rb:186-193`, ported in trails#8153), and
`railties/test/application/configuration_test.rb:1463-1485`
("config.action_view.cache_template_loading = false" / "= true") cannot be
ported.

## Acceptance criteria

- The actionview trailtie has the `railtie.rb:74-80` `after_initialize`, which
  assigns each remaining `actionView` config key on `Base` inside
  `onLoad("action_view")`.
- The invented `action_view.annotate_rendered_view_with_filenames` initializer
  is deleted; the loop covers it.
- The two `configuration_test.rb:1463-1485` tests are ported into
  `packages/trailties/src/application/configuration.test.ts` under their Rails names.
