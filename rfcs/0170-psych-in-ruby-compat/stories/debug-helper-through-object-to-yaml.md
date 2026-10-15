---
title: "DebugHelper#debug through toYaml, with Rails' rescue arm"
status: done
updated: 2026-10-15
rfc: "0170-psych-in-ruby-compat"
cluster: fidelity
packages: ["actionview"]
deps: ["psych-object-to-yaml", "psych-libyaml-seam-without-top-level-await"]
deps-rfc: []
est-loc: 60
priority: null
pr: trails#8925
claim: "2026-10-15T01:03:04Z"
assignee: "activerecord-delegation-encode-with-and-class-specific-relation-name"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/actionview/lib/action_view/helpers/debug_helper.rb:28-36`:
`Marshal.dump(object)`, then `ERB::Util.html_escape(object.to_yaml)` in
`<pre class="debug_dump">`, and `rescue` → `content_tag(:code,
object.inspect, class: "debug_dump")`. trails
(`packages/actionview/src/helpers/debug-helper.ts`) calls npm `stringify`.
`Marshal.dump(object)` is already ported: trails#8520 (story
`ruby-compat-has-no-marshal-for-schema-cache-and-debug`) made `debug` call it.

Fidelity trap: a bare Ruby `rescue` catches `StandardError` only. `LoadError`
is a `ScriptError`, so with `yaml` absent `debug` must **raise**, not fall back
to `inspect`.

## Acceptance criteria

- [ ] `debug` calls `toYaml(object)`. The fallback arm catches StandardError
      descendants only and re-raises `LoadError`.
- [ ] `debug` keeps the `Marshal.dump(object)` call first, as `debug_helper.rb:29` does.
- [ ] `debug-helper.test.ts` stays green, plus a case for the `LoadError`
      propagation.

## Verification

`pnpm vitest run packages/actionview/src/helpers/debug-helper.test.ts`.
