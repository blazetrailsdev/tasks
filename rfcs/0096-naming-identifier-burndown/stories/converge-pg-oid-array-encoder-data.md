---
title: "converge-pg-oid-array-encoder-data"
status: done
updated: 2026-08-17
rfc: "0096-naming-identifier-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6633
claim: "2026-08-17T09:26:50Z"
assignee: "converge-batches-kernel-array-locals"
blocked-by: null
closed-reason: null
---

## Context

Rails' `OID::Array`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql/oid/array.rb`)
holds `@pg_encoder` / `@pg_decoder` and spells the two ends as

    type_cast_array(@pg_decoder.decode(value), :deserialize)
    casted_values = type_cast_array(value, :serialize)
    Data.new(@pg_encoder.encode(casted_values))

trails
(`packages/activerecord/src/connection-adapters/postgresql/oid/array.ts`) has no
encoder/decoder objects — `parseArray` decodes inline — and its `Data` takes the
type plus the values array rather than the encoded string:
`new Data(this, this.typeCastArray(value, "serialize"))`.

Surfaced by the RFC 0096 `wave-4-naming-ar-adapters` cluster, which reports two
rows here (`type_cast_array` `decode` -> `value`, and `new` `pgEncoder`/
`castedValues` -> `this`/`typeCastArray`). Neither is a rename.

## Acceptance criteria

- [ ] `Array` owns the encoder/decoder pair Rails does, and `deserialize` /
      `serialize` mirror the Ruby bodies including the `casted_values` local.
- [ ] `Data` carries what Rails' `Data` carries.
- [ ] Both `array.ts` naming rows clear in
      `pnpm parity:api:calls:args:report`, no new `shape` row.
- [ ] PostgreSQL lane green (array-type tests).
