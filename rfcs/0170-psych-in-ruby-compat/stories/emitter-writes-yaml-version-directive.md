---
title: "Psych emitter writes the %YAML version directive for header:/version:"
status: in-progress
updated: 2026-10-16
rfc: "0170-psych-in-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#8974
claim: "2026-10-16T13:14:55Z"
assignee: "messages-marshal-with-fallback-uses-real-marshal"
blocked-by: null
closed-reason: null
---

## Context

`YAMLTree#push` (`vendor/ruby/v3.3.11/ext/psych/lib/psych/visitors/yaml_tree.rb:102-119`) now sets `Document#version` for `header:` / `version:` (trails#8968), but the emitter backend (`packages/ruby-compat/src/psych/emitter.ts:210`, `startDocument(_version, ...)`) ignores the version, so `Psych.dump("a", header: true)` gives `"--- a\n"` where Ruby gives `"%YAML 1.1\n--- a\n"` (libyaml `yaml_emitter_emit_document_start`).

## Acceptance criteria

- `Psych::Emitter#start_document` writes the `%YAML` directive when `version` is non-empty, and the tag directives.
- `psych.trails.test.ts` pins `Psych.dump("a", header: true)` and `version: "1.1"` against `ruby -ryaml`.
