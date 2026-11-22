---
title: "query-log-controller-tag-is-function-source"
status: draft
updated: 2026-11-22
rfc: "0142-trailties-surfaced-deviations"
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

## Context

With `config.activeRecord.queryLogTagsEnabled = true` (generated development.ts), every query's
`controller` tag is the URL-encoded source of the `controllerName` method, e.g.
`controller='controllerName()%20%7B%0A%20%20...return%20this.constructor.controllerName()'`
(seen in examples/chatter's log). Rails' tag is `context[:controller]&.controller_name`
(vendor/rails/v8.0.5.2/activerecord/lib/active_record/railties/controller_runtime.rb and
query_logs tag set in railtie.rb:365-392); the trails tagging reads the method instead of calling it.

## Acceptance criteria

- The `controller` query-log tag is the controller name (`rooms`), not the function source.
- A test in trailties or activerecord pins the tag value for a controller request.
