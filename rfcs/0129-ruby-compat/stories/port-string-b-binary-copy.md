---
title: "Port String#b — the non-mutating BINARY copy the multipart builder makes on every appended line"
status: done
updated: 2026-09-04
rfc: "0129-ruby-compat"
cluster: null
packages: ["ruby-compat"]
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 7475
claim: "2026-09-04T12:11:34Z"
assignee: "port-string-b-binary-copy"
blocked-by: null
closed-reason: null
---

## Context

`String#b` — a copy of the receiver with `ASCII-8BIT` (`BINARY`) encoding — has
no port. `packages/ruby-compat/src/string/force-encoding.ts:15` exports
`forceEncoding(string, encoding)`, which is the _mutating_ `force_encoding`, and
`Encoding.BINARY` exists (`packages/ruby-compat/src/encoding.ts:146`), but
nothing spells `.b`. The one existing mention in the backlog,
`0119-connection-adapter-fidelity/postgresql-write-query-invalid-encoding-arm`,
is about an encoding _arm_, not this member.

Surfaced by RFC 0137-rack-test-gem-port: `Rack::Test::Utils`' multipart builder
calls it on **every** line it appends —
`parameter_name.to_s.b` (`utils.rb:125,137`), `value.to_s.b` (`:127`),
`escape_path(uploaded_file.original_filename).b` (`:139`),
`uploaded_file.content_type.to_s.b` (`:141`),
`uploaded_file.size.to_s.b` (`:143`) — so `port-rack-test-utils` cannot make
the calls Rails makes without it, and the whole point of the `.b` there is that
the multipart buffer is binary, so dropping it is a real behavioural
divergence, not a spelling one.

`b` is one character and `rubyMethodToTs` (`scripts/parity/conventions.ts`)
leaves it alone, so the TS name is `b`. Check `SKIP_GROUPS` /
`SCOPED_SKIP_GROUPS` there before assuming otherwise.

## Acceptance criteria

- [ ] `b` on the ruby-compat `String` seat (`packages/ruby-compat/src/string/`),
      anchored to MRI's `String#b`, returning a **copy** — `force_encoding`
      mutates, `b` does not, and the difference is the reason both exist.
- [ ] A test pins that the receiver is unchanged and the result reports
      `Encoding::BINARY` (`encoding.ts:146`).
- [ ] `pnpm parity:api:extra:gate` green — ruby-compat is pinned at `novel` 0,
      so the member must be scored against MRI, not carry a receipt.
