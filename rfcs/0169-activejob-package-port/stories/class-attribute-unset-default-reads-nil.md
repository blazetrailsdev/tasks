---
title: "classAttribute / mattrAccessor with no default read nil, not undefined"
status: done
updated: 2026-10-20
rfc: "0169-activejob-package-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#9115
claim: "2026-10-20T01:39:19Z"
assignee: "class-attribute-unset-default-reads-nil"
blocked-by: null
closed-reason: null
---

## Context

`classAttribute` (`packages/activesupport/src/class-attribute.ts:62`) leaves an attribute with no `default:` reading `undefined`, where Rails' `class_attribute` reads `nil` (`activesupport/lib/active_support/core_ext/class/attribute.rb`, `default: nil`). Found on trails#9067: `ActiveJob::Base.queue_name_prefix` (`activejob/lib/active_job/queue_name.rb:57`) and `priority`, whose default is `default_priority` (`queue_priority.rb:49`, itself an unset `mattr_accessor`), read `undefined`, so the tests had to assert `== null`.

## Acceptance criteria

- [ ] `classAttribute` with no `default:` reads `null`, and so does `mattrAccessor` with no `default:` (`module/attribute_accessors.rb`).
- [ ] The `== null` checks in `packages/activejob/src/queue-name.trails.test.ts` become `toBeNull()`.
