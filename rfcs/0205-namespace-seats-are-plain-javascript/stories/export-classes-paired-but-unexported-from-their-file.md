---
title: "Export the 16 paired-but-unexported classes so the generated class-path table names them"
status: ready
updated: 2026-10-27
rfc: "0205-namespace-seats-are-plain-javascript"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#9365 landed `scripts/api-compare/class-paths.ts`. Its `--check` reds on a
class that `parity:api` pairs with a Ruby class but that no generated table can
name, because the class is not exported. Sixteen such classes were seeded into the
only-shrink `KNOWN_UNEXPORTED` set there. Until they are exported, each answers
its bare JS `klass.name` from `rbModName` (`packages/ruby-compat/src/object.ts`)
where Ruby's `rb_mod_name` (`vendor/ruby/v3.3.11/variable.c:122`) answers the full
path:

- `ActiveRecord::Associations::JoinDependency::Aliases::{Table,Column}`
  (`activerecord/lib/active_record/associations/join_dependency.rb`)
- `ActiveRecord::Migration::Compatibility::V6_1::PostgreSQLCompat`,
  `V6_0::ReferenceDefinition` (`migration/compatibility.rb`)
- `ActiveRecord::Relation::StrictLoadingScope` (`relation.rb`)
- `Mime::Type::InvalidMimeType` (`action_dispatch/http/mime_type.rb`)
- `ActionDispatch::Routing::Mapper::BacktraceCleaner` (`routing/mapper.rb`)
- `ActionController::TestRequest::ENCODER` (`action_controller/test_case.rb`)
- `Rack::Session::Cookie::{Base64,Base64::JSON,Base64::ZipJSON,Identity,SessionId}`
  (`rack-session/lib/rack/session/cookie.rb`)
- `Rack::Session::Encryptor::{Error,InvalidSignature,InvalidMessage}`
  (`rack-session/lib/rack/session/encryptor.rb`)

## Acceptance criteria

- [ ] Each class is exported from the TS file that mirrors its `.rb`, and its row
      is deleted from `KNOWN_UNEXPORTED`.
- [ ] `pnpm parity:class-paths` regenerates the tables, and `--check` is green
      with `KNOWN_UNEXPORTED` empty, after which the set is deleted.
- [ ] `rbModName` answers each one's Rails path once its package entry is loaded.
