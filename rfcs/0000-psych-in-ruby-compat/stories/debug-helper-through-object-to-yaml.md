---
title: "DebugHelper#debug through toYaml, with Rails' rescue arm"
status: draft
updated: 2026-09-29
rfc: "0000-psych-in-ruby-compat"
cluster: fidelity
packages: ["actionview"]
deps: ["psych-object-to-yaml"]
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/actionview/lib/action_view/helpers/debug_helper.rb:28-36`:
`Marshal.dump(object)`, then `ERB::Util.html_escape(object.to_yaml)` in
`<pre class="debug_dump">`, and `rescue` → `content_tag(:code,
object.inspect, class: "debug_dump")`. trails
(`packages/actionview/src/helpers/debug-helper.ts`) calls npm `stringify`.

Fidelity trap: a bare Ruby `rescue` catches `StandardError` only. `LoadError`
is a `ScriptError`, so with `yaml` absent `debug` must **raise**, not fall back
to `inspect`.

## Acceptance criteria

- [ ] `debug` calls `toYaml(object)`. The fallback arm catches StandardError
      descendants only and re-raises `LoadError`.
- [ ] `Marshal.dump` carries `@missingRailsCall … — CONVERGEABLE ruby-compat-has-no-marshal-for-schema-cache-and-debug`.
- [ ] `debug-helper.test.ts` stays green, plus a case for the `LoadError`
      propagation.

## Verification

`pnpm vitest run packages/actionview/src/helpers/debug-helper.test.ts`.
