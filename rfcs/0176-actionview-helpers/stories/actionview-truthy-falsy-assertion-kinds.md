---
title: "actionview-truthy-falsy-assertion-kinds"
status: draft
updated: 2026-10-21
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# actionview tests port assert / assert_not as toBe(true/false)

## Context

`pnpm parity:test --package actionview --assertions --missing` (2026-10-21): ~45 kind mismatches across `capture_helper_test.rb` (17), `erb_util_test.rb` (7), `output_safety_helper_test.rb` (6), `template_path_test.rb` (9), `sanitize_helper_test.rb` (3), `form_options_helper_test.rb` (1) and `javascript_helper_test.rb` (`assert_instance_of` dropped) are one mechanical class: Rails `assert x` / `assert_not x` / `assert_predicate x, :html_safe?` ported as `expect(x).toBe(true)` / `toBe(false)` (equal), e.g. `content for with block` (`vendor/rails/v8.0.2/actionview/test/template/capture_helper_test.rb:73-81`, `assert_not content_for?(:title)` → `expect(av.isContentFor("title")).toBe(false)`). Classified as **real misses** (a kind miss, per the `assert_not_equal` → `notEqual` precedent), plus a few dropped `assert_equal`s in `output_safety_helper_test.rb` (`safe_join ... $,`) and `erb_util_test.rb` (`json escape does not alter json string meaning`'s `assert_nil`).

## Acceptance criteria

- Each listed assertion uses its Rails kind (truthy / falsy / nil / instanceOf); dropped ones are restored.
- The listed files show 0 kind mismatches.
