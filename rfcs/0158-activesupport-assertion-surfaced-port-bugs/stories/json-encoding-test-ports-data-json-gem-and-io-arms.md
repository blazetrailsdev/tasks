---
title: "Port the five it.skip arms in json/encoding.test.ts (Data, JSON gem dump/generate, IO)"
status: draft
updated: 2026-11-17
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#10258 folded the flat `json-encoding.test.ts` into `packages/activesupport/test/json/encoding.test.ts`. Five of the Rails names it moved are bare `it.skip`s with no receipt. Each has a Rails body that can be ported:

- `test_data_encoding` (`vendor/rails/v8.0.2/activesupport/test/json/encoding_test.rb:349-356`). `Data.define(:name, :email)` instances encode through `Data#as_json` (`core_ext/object/json.rb`, which maps `to_h`, the same as `Struct#as_json` at :74-78). ruby-compat has no `Data`.
- `test_json_gem_dump_by_passing_active_support_encoder`, `..._generate_...` and `..._pretty_generate_...` (`encoding_test.rb:377-405`). `JSON.dump`, `JSON.generate` and `JSON.pretty_generate` on a `Hash` subclass must not call its `as_json`, because the gem's generator bypasses `ToJsonWithActiveSupportEncoder`.
- `test_to_json_works_on_io_objects` (`encoding_test.rb:482-484`). `STDOUT.to_json == STDOUT.to_s.to_json`, through `Object#as_json` (instance values).

## Acceptance criteria

- Each of the five tests is a real port of the Rails body, or is parked as `PERMANENT-SKIP` citing a ratified CLAUDE.md section.
- Any `Data` port lands in ruby-compat with its MRI citation (`vendor/ruby/v3.3.11/struct.c`, `rb_data_s_def`).
