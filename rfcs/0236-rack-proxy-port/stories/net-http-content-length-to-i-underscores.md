---
title: "content_length= reads a String like Ruby's to_i"
status: draft
updated: 2026-11-14
rfc: "0236-rack-proxy-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`HTTPHeader#content_length=` (`vendor/ruby/v3.3.11/lib/net/http/header.rb:637-643`) writes `len.to_i.to_s`. Ruby's `String#to_i` accepts underscores between digits (`"1_000".to_i == 1000`). The port (`packages/ruby-compat/lib/net/http/request.ts` `set contentLength`) uses `/^\s*[-+]?\d+/`, which stops at the underscore and gives `1`.

## Acceptance criteria

- `contentLength = "1_000"` writes `"1000"`, through ruby-compat's own `String#to_i` port if one exists, else a regex matching MRI `rb_cstr_to_inum` underscore rules.
- A test citing `header.rb:642`.
