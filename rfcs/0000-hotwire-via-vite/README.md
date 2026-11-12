---
rfc: "0000-hotwire-via-vite"
title: "Hotwire via Vite (meta): ruling, trailties convergence, and the five gem-port RFCs"
status: draft
created: 2026-11-12
updated: 2026-11-12
owner: "@deanmarano"
packages:
  - "trailties"
  - "vite-trails"
  - "scripts"
clusters:
  - ruling
  - vite
  - generator
---

<!-- Unnumbered until merge: copy this dir to `rfcs/0000-your-slug`, keep `rfc:`
     as 0000-your-slug and the H1 below number-free. `scripts/finalize-rfc.mjs`
     swaps 0000 for the assigned number at merge. -->

# RFC — Hotwire via Vite (meta): ruling, trailties convergence, and the five gem-port RFCs

## Summary

A generated trails app should ship with Hotwire the way a generated Rails 8 app
does: `turbo_frame_tag`, `turbo_stream` responses, model broadcasts over
Action Cable, and Stimulus controllers. Rails delivers the JavaScript through
importmap-rails and propshaft. trails delivers it through Vite instead, by
porting the `vite_ruby` and `vite_rails` gems. The JS libraries
(`@hotwired/turbo-rails`, `@hotwired/stimulus`, `vite`, `vite-plugin-ruby`)
are npm dependencies and are not ported. The Ruby gems around them are ported
as five new packages, one RFC each.

This is the meta RFC. It owns the cross-cutting pieces: the ruling, the
package boundaries, the runtime topology, the trailties convergence stories,
the end-to-end verification and the open questions. Each gem port is its own
RFC, scoped to its package:

| RFC (slug)         | Package                    | Stories |
| ------------------ | -------------------------- | ------- |
| `rack-proxy-port`  | `@blazetrails/rack-proxy`  | 1       |
| `vite-assets-port` | `@blazetrails/vite-assets` | 5       |
| `vite-trails-port` | `@blazetrails/vite-trails` | 2       |
| `turbo-port`       | `@blazetrails/turbo`       | 9       |
| `stimulus-port`    | `@blazetrails/stimulus`    | 2       |

The RFCs are cross-referenced by slug, and they are linked through story
`deps` rather than `deps-rfc`. `finalize-rfc.mjs` rewrites a `0000-<slug>` id
only inside that RFC's own files, so a `deps-rfc` between RFCs that are not
yet numbered would break at merge. Story ids do not change, so story deps
survive finalization.

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

Every gem the four depend on is already ported except two runtime
dependencies of vite_ruby (`vite_ruby/vite_ruby.gemspec:22-26`):

- `rack-proxy`. `ViteRuby::DevServerProxy < Rack::Proxy` at
  `vite_ruby/lib/vite_ruby/dev_server_proxy.rb:6`. It gets its own RFC and
  package (`rack-proxy-port`).
- `dry-cli`. `ViteRuby::CLI` does `extend Dry::CLI::Registry` at
  `vite_ruby/lib/vite_ruby/cli.rb:7-18`, and every `CLI::*` command subclasses
  `Dry::CLI::Command`, as in `cli/install.rb:6`. It is not ported. The CLI is
  expressed on trails' existing Thor port instead (open question 4).

## Design

### The ruling (for the operator to ratify)

The operator chose Vite over importmap-rails/propshaft on 2026-11-12 (see
Alternatives). The `hotwire-vite-claude-md-ruling` story lands this text as a new
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
> `ViteTrails::TagHelpers` renders the tags. The npm `vite`,
> `vite-plugin-ruby`, `@hotwired/turbo-rails` and `@hotwired/stimulus` are
> dependencies, not ports.
>
> - The app generator's `--javascript` default is `vite`, and `runJavascript`
>   calls `vite:install`. This is a deliberate deviation from
>   `app_base.rb`. `importmap` is not offered.
> - actionview's `AssetUrlHelper` and `AssetTagHelper` stay faithful and do not
>   know about any pipeline. Nothing in actionview names Vite. All Vite
>   knowledge lives in `@blazetrails/vite-assets` (the `vite_ruby` port) and
>   `@blazetrails/vite-trails`.
> - Both packages handle only the app's browser assets. trails' toolchain
>   uses of Vite (vitest, trailties' test-only `trailsPlugin`, the website
>   build) never import them, and they never import those. An ESLint
>   `no-restricted-imports` boundary enforces this.
> - `@blazetrails/turbo` and `@blazetrails/stimulus` (the turbo-rails and
>   stimulus-rails ports) stay Vite-free. Their `turbo:install` and
>   `stimulus:install` port only the non-importmap (jsbundling) branch, and that
>   branch targets the vite_rails entrypoint layout: the generated
>   `config/vite.json` sets `sourceCodeDir: "app/javascript"`, so the
>   templates write `app/javascript/entrypoints/application.js` (one changed
>   path segment, receipted).
> - trails apps use pnpm. The generated app is a pnpm project
>   (`pnpm-lock.yaml`), and the install templates' hard-coded `yarn add`
>   becomes `pnpm add`, a receipted one-token change. yarn is not used. The
>   templates hard-code pnpm, rather than reusing vite_ruby's lockfile
>   detection, so a trails app always gets pnpm and does not depend on which
>   lockfile is present. vite_ruby's detection is still ported as written for
>   `vite:install`, and it resolves to pnpm in a generated app. The bun arm
>   fires only in an app the user has moved to bun (`bun.lockb` present). It
>   is kept so the port stays faithful, and a generated app never takes it. `turbo:install` and
>   `stimulus:install` pick bun when `using_bun?` is true and node otherwise,
>   as upstream does with the importmap arm removed.
> - The npm package is `@hotwired/turbo-rails`, as `turbo_with_node.rb` adds
>   it. stimulus-rails' node branch is ported verbatim, `Stimulus::Manifest`
>   included, so `controllers/index.js` is a static manifest and not an
>   `import.meta.glob`.
> - `trails server` boots the Rack app, `DevServerProxy` forwards Vite
>   requests, and `bin/vite dev` runs Vite in its own process, as in
>   vite_rails. `trailsPlugin` (Rack-inside-Vite) remains only as test
>   infrastructure.
> - Package and identifier names follow the `rails` → `trails` token rename
>   in `docs/ruby-ts-conventions.md`, compound names included: `vite_rails`
>   is `@blazetrails/vite-trails` and `ViteRails::*` is `ViteTrails::*`.
>   turbo-rails and stimulus-rails drop the suffix and become
>   `@blazetrails/turbo` and `@blazetrails/stimulus`, as `bcrypt-ruby` is
>   `@blazetrails/bcrypt`. vite_ruby is `@blazetrails/vite-assets`. The Rails
>   spelling survives only where text quotes the Ruby side.
> - dry-cli is not ported. `bin/vite` (`ViteRuby::CLI`) is built on
>   `@blazetrails/thor`, with the gem's command class names and `call`
>   bodies unchanged and one receipt on the base class and option DSL.
> - importmap-rails' and propshaft's unported-files rows are permanent, as
>   Trilogy's are. A Rails test arm that exists only for importmap or propshaft
>   is dropped. `vite_hanami`, `vite_padrino` and `vite_plugin_legacy` are not
>   ported.
>
> Ruled by the operator on <ratification date>.

### Package boundaries

| Package                    | Ports                                                                                  | Knows about Vite?     |
| -------------------------- | -------------------------------------------------------------------------------------- | --------------------- |
| `@blazetrails/rack-proxy`  | `rack-proxy` gem's `Rack::Proxy`                                                       | no                    |
| `@blazetrails/vite-assets` | `vite_ruby/lib/vite_ruby{,.rb}`, `tasks/vite.rake`, `exe/vite`                         | yes                   |
| `@blazetrails/vite-trails` | `vite_rails/lib/vite_rails{,.rb}`, `tasks/vite.rake`                                   | yes                   |
| `@blazetrails/turbo`       | `lib/turbo*`, `app/{channels,controllers,helpers,jobs,models}/turbo`, the frame layout | install template only |
| `@blazetrails/stimulus`    | `lib/stimulus*`, `lib/generators/stimulus`, `lib/tasks`, `lib/install`                 | install template only |
| `@blazetrails/actionview`  | unchanged; `asset_url_helper.rb` stays pipeline-agnostic                               | no                    |
| `@blazetrails/trailties`   | generator default; retires `lib/assets/*`; `trails server` stops running inside Vite   | through vite-trails   |

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
Story `vite-trails-dev-server-topology` makes that switch: it wires
`DevServerProxy` in through the `vite_trails.proxy` initializer, stops
`trails server` from booting inside Vite, and writes the `Procfile.dev` /
`bin/dev` pair the generated app runs. `trailsPlugin` stays as test-only
infrastructure (open question 2).

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
  `packages/actionpack/CLAUDE.md` allows. Story `turbo-test-helpers`
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

Each phase names the RFC that owns its stories. Every story outside phase 1
depends on the ruling, directly or through its deps, so none starts before
ratification.

1. Ruling (this RFC): `hotwire-vite-claude-md-ruling`.
2. Leaf gem: `rack-proxy-port` (`rack-proxy-gem-port`).
3. `vite-assets-port`: `vite-assets-core-package`,
   `vite-assets-builder-commands-runner`, `vite-assets-dev-server-proxy`,
   `vite-assets-cli-and-binstub`, `vite-assets-rake-tasks`.
4. `vite-trails-port`: `vite-trails-package-and-tag-helpers`,
   `vite-trails-install-and-precompile-hook`. Then this RFC's trailties
   stories: `retire-trailties-vite-assets-trailtie`,
   `vite-trails-dev-server-topology`, `trailties-javascript-default-vite`,
   `vite-assets-import-boundary`.

5. `turbo-port`: `turbo-dummy-test-app`,
   `turbo-package-helpers-and-turbo-stream-format`, then
   `turbo-frames-native-and-request-id`, `turbo-streams-tag-builder`,
   `turbo-broadcasts-and-streams-channel`,
   `turbo-broadcastable-instance-broadcasts`,
   `turbo-broadcastable-class-methods-and-callbacks`,
   `turbo-test-helpers`, `turbo-install-task`.
6. `stimulus-port`: `stimulus-package-and-install`,
   `stimulus-controller-generator`.

## Verification

Every package has `compareApi` and `compareTests` on. Each child RFC's
Verification section owns its row. This table rolls them up:

| Package     | `parity:api` target (public)               | `parity:test` target                                          |
| ----------- | ------------------------------------------ | ------------------------------------------------------------- |
| turbo       | 163                                        | 247 = matched + `PERMANENT-SKIP`                              |
| stimulus    | 4                                          | 14 = matched + `PERMANENT-SKIP`                               |
| vite-assets | 118                                        | exact count recorded by `vite-assets-core-package`            |
| vite-trails | 14                                         | exact count recorded by `vite-trails-package-and-tag-helpers` |
| rack-proxy  | every public method in `lib/rack/proxy.rb` | every upstream test                                           |

A `PERMANENT-SKIP` is allowed for only three reasons, each citing the ratified
section: an importmap-only arm, a Capybara-selector arm with no Vitest
counterpart, or the Spring arm. Every other upstream test passes. The ~100 and
~20 test counts for vite_ruby and vite_rails come from a shared `test/`
directory. The first story of each package splits it, counts it exactly, and
updates this table.

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
   as a recorded deviation. **Owner:** `hotwire-vite-claude-md-ruling` (the
   draft ruling text carries the recommendation).
2. **`trailsPlugin` (Rack-inside-Vite).** Under the vite_rails topology it
   has no role. Options: (a) delete it in `retire-trailties-vite-assets-trailtie`;
   (b) keep it for the system-testing stories that drive an in-process Vite
   server (`converge-server-onto-in-process-vite-dev-server`,
   0166-actiondispatch-system-testing-parity). **Recommendation:**
   (b) for now, scoped to test-only use, and revisit after those stories land.
   Answered by the draft ruling text, and implemented by
   `vite-trails-dev-server-topology`.
3. **Entrypoint path (resolved: `app/javascript`).** `turbo_with_node.rb:1-3` and
   `stimulus_with_node.rb:10-15` append to `app/javascript/application.js`.
   vite_rails' default is `app/frontend/entrypoints/`
   (`vite_ruby/default.vite.json`: `sourceCodeDir`, `entrypointsDir`).
   Options: (a) the generated `config/vite.json` sets
   `sourceCodeDir: "app/javascript"`, and the install templates' path becomes
   `app/javascript/entrypoints/application.js`; (b) the templates read
   `Rails.application.config.javascript_path`, which vite_rails sets at
   `engine.rb:37-40`. **Decision:** (a), chosen by the operator on
   2026-11-12 over vite_ruby's `app/frontend` default. The templates keep the
   gem's hard-coded path shape, and only the directory segment the Vite layout
   forces changes. Each install story receipts that one segment. The
   ruling text records it.
4. **dry-cli (resolved: Thor).** `bin/vite` is a Dry::CLI registry. Options
   were (a) port `dry-cli` as its own package, or (b) express the commands on
   `@blazetrails/thor`, which trails already ports and which the `trails` CLI
   and generators already use. **Decision:** (b), chosen by the operator on
   2026-11-12. vite_ruby uses only dry-cli's registry and option DSL, and
   all the command logic is in the `call` bodies, which are ported
   unchanged. `ViteRuby::CLI` and each `CLI::*` class keep their names, so
   `parity:api` still keys on them. The base class and option DSL are one
   receipted deviation, which `vite-assets-cli-and-binstub` carries.
5. **The npm package for Turbo (resolved).** The operator's original request
   named `@hotwired/turbo`. The gem's node template adds `@hotwired/turbo-rails`
   (`turbo_with_node.rb:10`), which wraps `@hotwired/turbo` and adds
   `<turbo-cable-stream-source>`, which broadcasts need. The ruling text and
   `turbo-install-task` use `@hotwired/turbo-rails`.

## Changelog

- 2026-11-12: initial RFC.
- 2026-11-12: self-review. Added `dry-cli-gem-port`; split the 700-LOC
  `vite-assets-core-package` and `turbo-broadcastable` stories; moved
  `StreamName` into the first turbo story; resolved OQ5; gave OQ2/OQ4 owners;
  the ruling's date is left for ratification.
- 2026-11-12: review round 1. The ruling text now answers OQ1, OQ3 and OQ5 and
  the package-manager choice. The root stories are gated on the ruling. Added
  `vite-trails-dev-server-topology` and `turbo-dummy-test-app`. Split
  `vite-ruby-cli-and-tasks` into `vite-assets-cli-and-binstub` and
  `vite-assets-rake-tasks`. Verification targets are now per package, and
  rack-proxy and dry-cli are pinned.
- 2026-11-12: split into a meta RFC (this one) plus one RFC per ported gem:
  `rack-proxy-port`, `dry-cli-port`, `vite-assets-port`, `vite-trails-port`,
  `turbo-port` and `stimulus-port`. The stories moved unchanged,
  with their `rfc:` and `cluster:` updated.
- 2026-11-12: the operator chose pnpm. The install templates run `pnpm add`
  instead of `yarn add`, and the generated app is a pnpm project.
- 2026-11-12: the vite_ruby port is named `@blazetrails/vite-assets` (RFC
  `vite-assets-port`, stories `vite-assets-*`). Added
  `vite-assets-import-boundary`.
- 2026-11-12: OQ3 resolved. The operator chose `app/javascript` as the
  frontend source dir (`sourceCodeDir`), not `app/frontend`.
- 2026-11-12: OQ4 resolved to Thor. Removed the `dry-cli-port` RFC and its
  `dry-cli-gem-port` story. `vite-assets-cli-and-binstub` builds on
  `@blazetrails/thor`.
- 2026-11-12: applied the `rails` → `trails` token rename to compound names.
  `vite-rails-port` is now `vite-trails-port` (`@blazetrails/vite-trails`,
  `ViteTrails::*`). turbo-rails and stimulus-rails drop the suffix: RFCs
  `turbo-port` and `stimulus-port`, packages `@blazetrails/turbo` and
  `@blazetrails/stimulus`, stories `turbo-*` and `stimulus-*`.
