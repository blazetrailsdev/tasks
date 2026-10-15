---
title: "rack residual API: six missing members, two inheritance gaps, four arity rows, two unpinned bodies"
status: draft
updated: 2026-10-15
rfc: "0000-small-gem-ports-parity-100"
cluster: rack-api
packages: [rack]
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Remaining rack API gaps outside reloader, events and lint:

- Missing members: `Rack::Directory::DirectoryBody#DIR_FILE_escape` (`vendor/rack/v3.1.14/lib/rack/directory.rb:73`), `Rack::Headers#member?` and `#merge!`, `Rack::Multipart::Parser::MultipartInfo#tmp_files` / `tmp_files=`, `Rack::Request#has_header?` (`request.rb:95`), `Rack::Utils#multipart_part_limit` / `multipart_part_limit=`.
- Inheritance: `Rack::MediaType` is a Ruby class (`media_type.rb:6`) with no TS class (`ts-class-missing`), and `MultipartPartLimitError < Errno::EMFILE` (`multipart/parser.rb:10`) extends `Error` in TS.
- Arity (`output/arity-mismatches.json`): `auth/basic.rb valid?(auth)` vs TS `valid()`, `request.rb ip_filter()` vs `ipFilter(ip)`, `sendfile.rb variation(env)` vs `variation()`, `show_exceptions.rb template()` vs `template(env, exception, path, frames)`.
- Pins: 457/459, so 2 bodies are unpinned.

## Acceptance criteria

- [ ] rack reports 100% methods on every file other than `reloader.rb`, `events.rb` and `lint.rb`, and inheritance reaches 43/43.
- [ ] Arity is 337/337, and pins show 0 unpinned.
- [ ] `EMFILE` comes from ruby-compat's `Errno` (filed in 0154 if it is missing there), not from a local class.
