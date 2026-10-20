---
title: "rack residual API: eight missing members, two inheritance gaps, four arity rows, two unpinned bodies"
status: done
updated: 2026-10-19
rfc: "0193-small-gem-ports-parity-100"
cluster: rack-api
packages: [rack]
deps: [ruby-compat-errno-emfile]
deps-rfc: []
est-loc: 300
priority: null
pr: trails#9102
claim: "2026-10-19T22:57:51Z"
assignee: "rack-api-residual-members-inheritance-arity"
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
- [ ] `MultipartPartLimitError` extends ruby-compat's `Errno.EMFILE` (added by `ruby-compat-errno-emfile`; verified absent from `packages/ruby-compat/src/errno.ts` on 2026-10-15), not a local class.
- [ ] This story also owns the `show_exceptions pretty` `template()` call-argument row, which the `template` arity fix clears.
