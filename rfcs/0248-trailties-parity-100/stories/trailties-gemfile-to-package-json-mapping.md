---
title: "trailties: ratify the Gemfile/Bundler/gemspec → package.json/pnpm mapping"
status: draft
updated: 2026-11-19
rfc: "0248-trailties-parity-100"
cluster: receipts
packages: ["trailties"]
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC 0248's generator stories port Gemfile, Bundler and gemspec surface
(`vendor/rails/v8.0.2/railties/lib/rails/generators/app_base.rb`'s
`GemfileEntry`, `gemfile_entries`, the `*_gemfile_entry` builders,
`exec_bundle_command`, `add_bundler_platforms`; `plugin_generator.rb`'s
gemspec; `benchmark_generator.rb`'s `add_ips_to_gemfile`) with no ratified
Node mapping. trails today invents `trailsGemfileEntry`
(`packages/trailties/lib/generators/app-base.ts:512`), which answers a
package.json specifier. Of the Rails generator tests,
`generators/app_generator_test.rb` (bundle install, `bundle lock` for linux,
bundler binstub, bootsnap, `.ruby-version`, rubocop, brakeman),
`plugin_generator_test.rb` (~21 gemspec assertions) and
`devcontainer_generator_test.rb` turn on these concepts.

Operator ruling (2026-11-19), the mapping:

| Ruby                                                                                                                                        | Node                                                            |
| ------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Gemfile / `GemfileEntry` / `gemfile_entries`                                                                                                | `package.json` dependencies; one entry is one `name: specifier` |
| `bundle install` / `exec_bundle_command` / `after_bundle`                                                                                   | `pnpm install`, callbacks in the same order                     |
| gemspec                                                                                                                                     | the plugin's `package.json`                                     |
| `.ruby-version` / `ruby_version`                                                                                                            | `.node-version`                                                 |
| rubocop, brakeman (`--skip-rubocop`, `--skip-brakeman`, binstubs)                                                                           | eslint                                                          |
| `bundle lock --add-platform`, bundler binstub, bootsnap, benchmark-ips (`add_ips_to_gemfile`), Gemfile-only gems with no trails npm package | permanent: not ported                                           |

## Acceptance criteria

- [ ] `packages/trailties/CLAUDE.md` gains a section "A Gemfile is a
      package.json (`GemfileEntry`, `bundle install`, gemspec)" holding the
      table above, ruled by the operator on 2026-11-19.
- [ ] The section says how a ported test reads: a Gemfile assertion asserts
      the mapped `package.json` entry; a test on a permanent row is parked
      `PERMANENT-SKIP:` citing the section.
- [ ] Ports of `GemfileEntry` and friends keep the Rails names (per
      `docs/ruby-ts-conventions.md`), with bodies writing the mapped Node
      artifact; the section names `trailsGemfileEntry` as the member to
      converge onto the Rails name.
