---
rfc: "0000-hotwire-via-vite"
title: "Hotwire via Vite: port turbo-rails, stimulus-rails, vite_ruby and vite_rails"
status: draft
created: 2026-11-12
updated: 2026-11-12
owner: "@deanmarano"
packages:
  - "turbo-rails"
  - "stimulus-rails"
  - "vite-ruby"
  - "vite-rails"
  - "rack-proxy"
  - "trailties"
  - "actioncable"
  - "activerecord"
clusters:
  - ruling
  - vite
  - turbo
  - stimulus
  - generator
---

<!-- Unnumbered until merge: copy this dir to `rfcs/0000-your-slug`, keep `rfc:`
     as 0000-your-slug and the H1 below number-free. `scripts/finalize-rfc.mjs`
     swaps 0000 for the assigned number at merge. -->

# RFC — Hotwire via Vite: port turbo-rails, stimulus-rails, vite_ruby and vite_rails

## Summary

A generated trails app should ship with Hotwire the way a generated Rails 8 app
does: `turbo_frame_tag`, `turbo_stream` responses, model broadcasts over
Action Cable, and Stimulus controllers. Rails delivers the JavaScript through
importmap-rails and propshaft. trails delivers it through Vite instead, by
porting the `vite_ruby` and `vite_rails` gems. The JS libraries
(`@hotwired/turbo-rails`, `@hotwired/stimulus`, `vite`, `vite-plugin-ruby`)
are npm dependencies and are not ported. The Ruby gems around them are ported
as four new packages.

## Motivation

- No trails package ports turbo-rails or stimulus-rails. `pnpm tasks list`
  shows no prior story for either as of 2026-11-12.
- `AppBase#runHotwire` (`packages/trailties/lib/generators/app-base.ts:758`)
  already calls `turbo:install stimulus:install`, and `runJavascript`
  (`app-base.ts:745`) calls `importmap:install`. None of these three commands
  exists in trails, so the generator's default path calls commands nothing
  defines.
- trails already uses Vite, but through machinery it invented itself:
  - `packages/trailties/lib/assets/trailtie.ts` (`@noRailsEquivalent PERMANENT`)
    overwrites actionview's `computeAssetPath` on `ActionView::Base`'s
    prototype.
  - `assets/vite-manifest.ts` reads `public/assets/.vite/manifest.json` with a
    hard-coded `/assets` prefix.
  - `server/vite-plugin.ts` and `server/dev-server.ts` run the app inside
    Vite's dev server.
  - The `asset-helpers-skip-vite-hook-outside-boot` story
    (0142-trailties-surfaced-deviations) is a bug that design caused.

  vite_ruby / vite_rails is the Rails-ecosystem shape for the same job, and
  porting it lets these trails-invented pieces converge onto it.

### Measured scope (vendored by trails#10037)

| Gem (tag)                    | `.rb` files           | LOC  | Public methods | Internal | Upstream tests                                      |
| ---------------------------- | --------------------- | ---- | -------------- | -------- | --------------------------------------------------- |
| turbo-rails (v2.0.23)        | 27                    | 2160 | 163            | 18       | 247 in 18 files                                     |
| stimulus-rails (v1.3.4)      | 5 + 3 `.rb` templates | 146  | 4              | 2        | 14 in 2 files                                       |
| vite_ruby (vite_ruby@3.11.1) | 24 + rake             | 1728 | 118            | 72       | ~100 (shared `test/`)                               |
| vite_rails (same tag)        | 5 + rake              | 272  | 14             | 3        | ~20 (`helper_test.rb`, `engine_rake_tasks_test.rb`) |

The method counts come from `scripts/api-compare/extract-ruby-api.rb`, run over
the vendored trees. That is 299 public and 95 internal methods, about 4,300 Ruby
LOC, and 381 upstream tests. The JavaScript the gems ship is excluded:
`turbo-rails/app/javascript/turbo/` is the npm `@hotwired/turbo-rails`, and
`stimulus-rails/app/assets/javascripts/` is the npm `@hotwired/stimulus` build.

Every gem the four depend on is already ported except two, both runtime
dependencies of vite_ruby (`vite_ruby/vite_ruby.gemspec:22-26`):

- `rack-proxy`. `ViteRuby::DevServerProxy < Rack::Proxy` at
  `vite_ruby/lib/vite_ruby/dev_server_proxy.rb:6`.
- `dry-cli`. `ViteRuby::CLI` does `extend Dry::CLI::Registry` at
  `vite_ruby/lib/vite_ruby/cli.rb:7-18`, and every `CLI::*` command subclasses
  `Dry::CLI::Command`, as in `cli/install.rb:6`.

## Design

### The ruling (for the operator to ratify)

The `hotwire-vite-claude-md-ruling` story lands this text as a new
`trails/CLAUDE.md` section. It is drafted here and is not merged by this RFC:

> ## importmap-rails and propshaft are out of scope; JavaScript is served by Vite (`vite_rails`)
>
> A Rails 8 app serves JavaScript through importmap-rails and assets through
> propshaft (`railties/lib/rails/generators/app_base.rb`'s `javascript`
> default of `importmap`). trails ports neither gem. Vite fills both roles,
> through ports of the `vite_ruby` and `vite_rails` gems
> (`vendor/vite_ruby/v3.11.1/`): `ViteRuby::Config` reads
> `config/vite.json`, `ViteRuby::Manifest` resolves entries,
> `ViteRuby::DevServerProxy` proxies to the Vite dev server, and
> `ViteRails::TagHelpers` renders the tags. The npm `vite`,
> `vite-plugin-ruby`, `@hotwired/turbo-rails` and `@hotwired/stimulus` are
> dependencies, not ports.
>
> - The app generator's `--javascript` default is `vite`, and `runJavascript`
>   calls `vite:install`. This is a deliberate deviation from
>   `app_base.rb`. `importmap` is not offered.
> - actionview's `AssetUrlHelper` and `AssetTagHelper` stay faithful and do not
>   know about any pipeline. Nothing in actionview names Vite. All Vite
>   knowledge lives in `@blazetrails/vite-ruby` and `@blazetrails/vite-rails`.
> - turbo-rails and stimulus-rails stay Vite-free. Their `turbo:install` and
>   `stimulus:install` port only the non-importmap (jsbundling) branch, and that
>   branch targets the vite_rails entrypoint layout.
> - importmap-rails' and propshaft's unported-files rows are permanent, as
>   Trilogy's are. A Rails test arm that exists only for importmap or propshaft
>   is dropped. `vite_hanami`, `vite_padrino` and `vite_plugin_legacy` are not
>   ported.
>
> Ruled by the operator on 2026-11-12.

### Package boundaries

| Package                       | Ports                                                                                  | Knows about Vite?     |
| ----------------------------- | -------------------------------------------------------------------------------------- | --------------------- |
| `@blazetrails/rack-proxy`     | `rack-proxy` gem's `Rack::Proxy`                                                       | no                    |
| `@blazetrails/vite-ruby`      | `vite_ruby/lib/vite_ruby{,.rb}`, `tasks/vite.rake`, `exe/vite`                         | yes                   |
| `@blazetrails/vite-rails`     | `vite_rails/lib/vite_rails{,.rb}`, `tasks/vite.rake`                                   | yes                   |
| `@blazetrails/turbo-rails`    | `lib/turbo*`, `app/{channels,controllers,helpers,jobs,models}/turbo`, the frame layout | install template only |
| `@blazetrails/stimulus-rails` | `lib/stimulus*`, `lib/generators/stimulus`, `lib/tasks`, `lib/install`                 | install template only |
| `@blazetrails/actionview`     | unchanged; `asset_url_helper.rb` stays pipeline-agnostic                               | no                    |
| `@blazetrails/trailties`      | generator default; retires `lib/assets/*`, and converges `lib/server/vite-plugin.ts`   | through vite-rails    |

Each package mirrors its gem's file layout, so `parity:api` keys on it. The
`vendor/sources.ts` entries from trails#10037 already map the lib paths.
`compareApi` and `compareTests` are turned on by each package's first story.

### Runtime topology

vite_rails puts the Rails server in front. `DevServerProxy` is inserted at
middleware position 0 (`vite_rails/lib/vite_rails/engine.rb:6-8`) and forwards
`vite_should_handle?` requests to the Vite dev server
(`dev_server_proxy.rb:17-30,56-63`). trails today does the reverse:
`trailsPlugin` (`trailties/lib/server/vite-plugin.ts`) mounts the Rack app
inside Vite's `configureServer`. The faithful port is the vite_rails topology.
`trails server` boots the Rack app, and `bin/vite dev` runs Vite separately.
See open question 2 for what happens to `trailsPlugin`.

### What converges

- `trailties/lib/assets/trailtie.ts` and `vite-manifest.ts` are deleted.
  `vite_asset_path` and the other tag helpers are what resolve entries. The
  `computeAssetPath` override goes, and actionview's own `compute_asset_path`
  is used again for non-Vite assets. This is story
  `retire-trailties-vite-assets-trailtie`, which also closes
  `asset-helpers-skip-vite-hook-outside-boot`, since the helpers are installed
  through `ActiveSupport.on_load(:action_view)` (`engine.rb:10-18`), the same
  as in Rails.
- The generated `vite.config.ts`
  (`trailties/lib/generators/trails/app/templates/vite.config.ts.tt`) becomes
  what `ViteRuby::CLI::Install#create_configuration_files`
  (`vite_ruby/lib/vite_ruby/cli/install.rb:77-83`) writes, from the gem's
  templates.

## Non-goals

- **importmap-rails, propshaft and sprockets.** Vite fills their roles, per the
  ruling.
- **`@hotwired/turbo`, `@hotwired/turbo-rails`, `@hotwired/stimulus`, `vite`
  and `vite-plugin-ruby`.** These are npm dependencies.
  `turbo-rails/app/javascript/turbo/*.js` and
  `turbo-rails/app/assets/javascripts/turbo.js` are not ported.
- **vite_hanami, vite_padrino, vite_plugin_legacy and vite_rails_legacy.**
  They target other frameworks or legacy browsers.
- **`turbo:install:importmap` and `stimulus:install:importmap`, with their
  templates** (`lib/install/*_with_importmap.rb`). They depend on
  importmap-rails.
- **The Capybara selectors in `turbo-rails/lib/turbo/system_test_helper.rb`.**
  Those tests are ported only as far as the Vitest system-testing ruling in
  `packages/actionpack/CLAUDE.md` allows. Story `turbo-rails-test-helpers`
  decides how far, arm by arm.
- **Spring.** `engine.rb:26-34` watches through Spring, which trails does not
  have. That arm is dropped.

## Alternatives considered

- **Port importmap-rails and propshaft as Rails does.** The operator rejected
  this on 2026-11-12. Vite is already the trails dev server, and bare-specifier
  import maps would add a second asset path for the same files.
- **Keep the trailties Vite Trailtie and add Turbo on top of it.** This
  leaves a `@noRailsEquivalent PERMANENT` monkeypatch of actionview in place,
  where an upstream gem already provides the shape. Rejected under "Fidelity is
  the job".
- **Put the Vite tag helpers in actionview.** This breaks the
  pipeline-agnostic `AssetUrlHelper` that Rails ships. Rejected by the
  boundaries ruling.

## Rollout

1. Ruling: `hotwire-vite-claude-md-ruling`.
2. Vite core: `rack-proxy-gem-port`, `vite-ruby-core-package`,
   `vite-ruby-dev-server-proxy`, `vite-ruby-cli-and-tasks`.
3. Vite Rails: `vite-rails-package-and-tag-helpers`,
   `vite-rails-install-and-precompile-hook`,
   `retire-trailties-vite-assets-trailtie`, `trailties-javascript-default-vite`.
4. Turbo: `turbo-rails-package-helpers-and-turbo-stream-format`, then
   `turbo-rails-frames-native-and-request-id`, `turbo-rails-streams-tag-builder`,
   `turbo-rails-broadcasts-and-streams-channel`, `turbo-rails-broadcastable`,
   `turbo-rails-test-helpers`, `turbo-rails-install-task`.
5. Stimulus: `stimulus-rails-package-and-install`,
   `stimulus-rails-controller-generator`.

## Verification

- `parity:api` for turbo-rails, stimulus-rails, vite-ruby and vite-rails
  reaches the 299 public Ruby methods counted above, with `compareApi` on for
  all four.
- `parity:test` matches at least 90% of the 381 upstream tests. The
  Capybara-only and importmap-only arms are dropped with receipts.
- `trails new blog && cd blog && trails generate scaffold post title` boots
  with `trails server` plus `bin/vite dev`. A `turbo_stream_from @post` page
  receives a broadcast from `Post.create!` in a second process.
- `rg -n "computeAssetPath\"\]" packages/trailties` returns nothing, and
  `asset-helpers-skip-vite-hook-outside-boot` is closed.

## Open questions

1. **Stimulus controllers index: `Stimulus::Manifest` or `import.meta.glob`.**
   The operator asked for `controllers/index.js` to use `import.meta.glob`, as
   vite_rails-style apps do. stimulus-rails' node branch instead writes a
   static manifest that `stimulus:manifest:update` regenerates
   (`lib/install/app/javascript/controllers/index_for_node.js:1-8`,
   `lib/stimulus/manifest.rb:4-29`, `lib/tasks/stimulus_tasks.rake:47-68`). That
   manifest works under Vite unchanged. A glob template is new surface that
   the gem does not have, and it leaves `Stimulus::Manifest` and
   `stimulus:manifest:*` ported but unused. **Recommendation:** port the node
   branch verbatim, `Stimulus::Manifest` included, so the generated
   `index.js` is a manifest. Offer the glob only if the operator confirms it
   as a recorded deviation.
2. **`trailsPlugin` (Rack-inside-Vite).** Under the vite_rails topology it
   has no role. Options: (a) delete it in `retire-trailties-vite-assets-trailtie`;
   (b) keep it for the system-testing stories that drive an in-process Vite
   server (`converge-server-onto-in-process-vite-dev-server`). **Recommendation:**
   (b) for now, scoped to test-only use, and revisit after those stories land.
3. **Entrypoint path.** `turbo_with_node.rb:1-3` and
   `stimulus_with_node.rb:10-15` append to `app/javascript/application.js`.
   vite_rails' default is `app/frontend/entrypoints/`
   (`vite_ruby/default.vite.json`: `sourceCodeDir`, `entrypointsDir`).
   Options: (a) the generated `config/vite.json` sets
   `sourceCodeDir: "app/javascript"`, and the install templates' path becomes
   `app/javascript/entrypoints/application.js`; (b) the templates read
   `Rails.application.config.javascript_path`, which vite_rails sets at
   `engine.rb:37-40`. **Recommendation:** (a). The templates keep the
   gem's hard-coded path shape, and only the directory segment the Vite layout
   forces changes. Each install story receipts that one segment.
4. **dry-cli.** `bin/vite` is a Dry::CLI registry. Options: (a) port `dry-cli`
   as `@blazetrails/dry-cli`, with its own vendored source and a story;
   (b) express the commands as Thor, which trails already ports.
   **Recommendation:** (a). (b) is a rewrite of the gem's decomposition.
   `vite-ruby-cli-and-tasks` depends on this answer.
5. **The npm package for Turbo.** The decision text says `@hotwired/turbo`.
   The gem's node template adds `@hotwired/turbo-rails` (`turbo_with_node.rb:10`),
   which wraps `@hotwired/turbo` and adds `<turbo-cable-stream-source>`.
   Broadcasts need that element. **Recommendation:** `@hotwired/turbo-rails`,
   as the template says.

## Changelog

- 2026-11-12: initial RFC.
