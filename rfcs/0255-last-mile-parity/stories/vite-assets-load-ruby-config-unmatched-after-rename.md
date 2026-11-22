---
title: "vite-assets-load-ruby-config-unmatched-after-rename"
status: done
updated: 2026-11-22
rfc: "0255-last-mile-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10558
claim: "2026-11-22T13:16:41Z"
assignee: "each-chunk-byterange-walks-encoding-characters"
blocked-by: null
closed-reason: null
---

## Context

trails#10536 (e4bab889d9) renamed `packages/vite-assets/lib/config.ts`
`loadTsConfig` to `loadRubyConfig`, which is the spelling of Rails'
`ViteRuby::Config#load_ruby_config`
(`vendor/vite_ruby/v3.11.1/vite_ruby/lib/vite_ruby/config.rb:65`). After that
change, `pnpm api:compare --package vite-assets --missing` at e3b832caf9 still
expects the old name:

    config.rb   config.ts   23 1 0 24  96%
        - load_ruby_config → loadTsConfig
    Overall: 210/211

Before the rename it was 211/211, so the rename cost the package one
matched method. Some name translation in api-compare still turns
`ruby` into `Ts` for this method. There is no `loadTsConfig` in any mark
JSON under scripts/api-compare.

Found while bumping trailmap's vendored trails (trailmap#191), where it is
the only per-package api:compare regression between f2538399f7 and
e3b832caf9.

## Acceptance criteria

- `pnpm api:compare --package vite-assets` reports 211/211 with
  `load_ruby_config` matched to `loadRubyConfig`.
- A test in scripts/api-compare pins the translation, so a Ruby method
  whose name contains `ruby` maps to the TS name spelled `Ruby`.
