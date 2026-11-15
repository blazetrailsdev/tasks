---
title: 'vite-assets Build uses Time.parse and strftime("%F %T")'
status: draft
updated: 2026-11-15
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
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

`ViteRuby::Build` writes its timestamp with `Time.now.strftime("%F %T")`
(`vendor/vite_ruby/v3.11.1/vite_ruby/lib/vite_ruby/build.rb:59`) and reads it back
in `retry_failed?` with `Time.parse(timestamp) + 3 < Time.now` (`:50`). No
`Time.parse` / `Time#strftime` is reachable from vite-assets. So
`packages/vite-assets/lib/build.ts` pads the date fields by hand in `withResult`,
and in `isRetryFailed` parses the timestamp with `new Date(…replace(" ", "T"))`
and compares milliseconds.

## Acceptance criteria

- `withResult` formats with the ruby-compat (or activesupport) `strftime("%F %T")`.
- `isRetryFailed` uses `Time.parse` and `+ 3`. An unparseable timestamp still
  takes the `rescue ArgumentError` arm (`build.rb:51-52`).
- The builder tests still pass.
