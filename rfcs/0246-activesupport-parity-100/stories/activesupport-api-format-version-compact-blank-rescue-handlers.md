---
title: "activesupport: port format_version, compact_blank! and rescue_handlers"
status: done
updated: 2026-11-22
rfc: "0246-activesupport-parity-100"
cluster: api-residuals
packages: [activesupport]
deps: []
deps-rfc: []
est-loc: 150
priority: 4
pr: trails#10553
claim: "2026-11-22T04:01:29Z"
assignee: "activesupport-api-format-version-compact-blank-rescue-handlers"
blocked-by: null
closed-reason: null
---

## Context

`parity:api` lists `cache.rb` `format_version` ×2
(`vendor/rails/v8.0.2/activesupport/lib/active_support/cache.rb`),
`compact_blank!` (`core_ext/enumerable.rb`) and `rescuable.rb`
`rescue_handlers` ×6 (the `class_attribute` reader, writer and predicate on
each host). Found by RFC `0000-last-mile-parity`.

## Acceptance criteria

- [ ] Each member is ported at its Rails name and file and credited on `parity:api`.
