---
title: "Port Rails::Generators::ChannelGenerator and its templates"
status: draft
updated: 2026-10-01
rfc: "0000-actioncable-package-port"
cluster: fidelity
packages: ["trailties"]
deps: ["port-actioncable-test-unit-channel-generator"]
deps-rfc: []
est-loc: 550
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/actioncable/lib/rails/generators/channel/channel_generator.rb` (127 lines) and its
six templates and `USAGE` file (the generator's `--help` text), ported
under `packages/trailties/src/generators/rails/channel/`. The Rails test is
`vendor/rails/v8.0.2/railties/test/generators/channel_generator_test.rb` (13 cases), in trailties'
`parity:test` population.

- `source_root`; `argument :actions, type: :array, default: [], banner:
"method method"`; `class_option :assets, type: :boolean`;
  `check_class_collision suffix: "Channel"`; `hook_for :test_framework`
  (`:8-16`).
- `create_channel_files` (`:18-37`), the one public step.
- Private: `create_shared_channel_files`, `create_channel_file`,
  `create_shared_channel_javascript_files`,
  `create_channel_javascript_file`,
  `import_channels_in_javascript_entrypoint`,
  `import_channel_in_javascript_entrypoint`,
  `install_javascript_dependencies`, `pin_javascript_dependencies`,
  `file_name`, `first_setup_required?`, `using_javascript?`,
  `using_js_runtime?`, `using_bun?`, `using_node?`, `using_importmap?`,
  `root` (`:40-124`).

**The browser client** (RFC "Browser client"). The JavaScript templates import
`@rails/actioncable`, which is already JavaScript and published on npm; the
generator adds that package to the application and trails does not re-export
or vendor it.

**RFC 0171 (Thor)** is converging trailties' generators onto `Thor::Group`
and `Thor::Actions`. This generator uses `template`, `copy_file`,
`append_to_file`, `gsub_file`, `run`, `say` and `hook_for`. Write it
against the surface that exists when the story is claimed; if a Thor action it
needs is still a 0171 story, depend on that story with `tasks set-deps`. Do
not add a stand-in.

## Rails files owned by this story

- `vendor/rails/v8.0.2/actioncable/lib/rails/generators/channel/channel_generator.rb`
- `vendor/rails/v8.0.2/actioncable/lib/rails/generators/channel/USAGE`
- `vendor/rails/v8.0.2/actioncable/lib/rails/generators/channel/templates/application_cable/channel.rb.tt`
- `vendor/rails/v8.0.2/actioncable/lib/rails/generators/channel/templates/application_cable/connection.rb.tt`
- `vendor/rails/v8.0.2/actioncable/lib/rails/generators/channel/templates/channel.rb.tt`
- `vendor/rails/v8.0.2/actioncable/lib/rails/generators/channel/templates/javascript/channel.js.tt`
- `vendor/rails/v8.0.2/actioncable/lib/rails/generators/channel/templates/javascript/consumer.js.tt`
- `vendor/rails/v8.0.2/actioncable/lib/rails/generators/channel/templates/javascript/index.js.tt`

## Rails tests owned by this story

- `vendor/rails/v8.0.2/railties/test/generators/channel_generator_test.rb` (trailties' `parity:test` population):
  - [ ] `shared channel files are created`
  - [ ] `specific channel files are created under importmap`
  - [ ] `specific channel files are created under node`
  - [ ] `channel with multiple actions is created`
  - [ ] `shared channel javascript files are created`
  - [ ] `import channels in javascript entrypoint`
  - [ ] `import channels in javascript entrypoint under node`
  - [ ] `pin javascript dependencies`
  - [ ] `first setup only happens once`
  - [ ] `javascripts not generated when assets are skipped`
  - [ ] `invokes default test framework`
  - [ ] `revoking`
  - [ ] `channel suffix is not duplicated`

## Fidelity traps (predicted at authoring)

- [ ] **`js_template`** (`:61`) is `Rails::Generators::NamedBase#js_template` (`vendor/rails/v8.0.2/railties/lib/rails/generators/named_base.rb:29-31`, `template(source + ".js", destination + ".js")`); trailties has none (`grep -rn jsTemplate packages/trailties/src` is empty). Port it on `NamedBase` at its Rails name, in this story.
- [ ] **`create_shared_channel_files` returns unless `behavior == :invoke`**: `destroy` must not remove `application_cable/channel` and `connection`. "revoking" asserts they survive.
- [ ] **The two shared files are `copy_file`d from `.rb.tt` sources by absolute path**, not rendered.
- [ ] **`first_setup_required?`** is `!root.join("app/javascript/channels/index.js").exist?`, read before the file is created; "first setup only happens once" runs the generator twice.
- [ ] **Four predicates are memoized with `||=`**, so a false result is recomputed each call. Harmless here, but port the `||=` and do not cache false.
- [ ] **`using_javascript?`** is `options[:assets] && root.join("app/javascript").exist?`; `assets` has no default, so it is nil unless passed.
- [ ] **Importmap vs node**: `gsub_file … /\.\/consumer/, "channels/consumer" unless using_js_runtime?`, and the two import lines differ (`import "channels"` vs `import "./channels"`, `import "channels/chat_channel"` vs `import "./chat_channel"`).
- [ ] **`install_javascript_dependencies`** runs `bun add @rails/actioncable` or `yarn add @rails/actioncable`. Decide the trails package-manager command (the repo uses pnpm) at this call and keep the `using_bun?` / `using_node?` arms.
- [ ] **`pin_javascript_dependencies`** appends two lines to `config/importmap.rb`. trails has no importmap; keep the arm behind `using_importmap?`, which is then false, and port its test with the file present.
- [ ] **`channel.js.tt`'s comma logic**: `<%= actions.any? ? ",\n" : '' %>` after `received`, and `<%= action == actions[-1] ? '' : ",\n" %>` between actions. "channel with multiple actions is created" matches the exact text.
- [ ] **`file_name` strips a trailing `_channel`**; "channel suffix is not duplicated" asserts `chat_channel` does not produce `ChatChannelChannel`.
- [ ] **`channel.rb.tt`** wraps the class in `module_namespacing`.

## Acceptance criteria

- [ ] The generator, its six templates and its `USAGE` text are ported under their Rails names and paths, and `trails g channel --help` prints the usage.
- [ ] All 13 cases of `channel_generator_test.rb` are ported under their Rails names and credited in `parity:test` for trailties.
- [ ] `trails g channel chat speak` in a generated app writes a channel that extends `ApplicationCable.Channel` and a test file from the test-unit generator.

## Definition of done

A generator that writes the JavaScript files unconditionally, or one built on a stand-in for a Thor action, does not close this story.

## Verification

```bash
pnpm vitest run packages/trailties/src/generators/rails/channel packages/trailties/src/generators/named-base.test.ts
pnpm parity:test && pnpm parity:test:assertions   # channel_generator_test.rb 13 of 13 for trailties
```
