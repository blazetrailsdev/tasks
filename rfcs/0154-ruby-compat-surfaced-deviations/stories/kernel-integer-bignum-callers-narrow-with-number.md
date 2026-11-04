---
title: "Kernel#Integer bignum callers narrow with Number() where Ruby keeps an Integer"
status: draft
updated: 2026-11-04
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#9733 made ruby-compat's `kernelInteger` (`Kernel#Integer`, `vendor/ruby/v3.3.11/object.c:3257-3355`) answer a `bigint` past 2^53, as MRI answers a Bignum. Callers whose surrounding code holds a JS `number` now narrow with `Number(...)`, a coercion Ruby does not have:

- `packages/date/src/time.ts` `obj2vint` (MRI `time.c` `obj2vint` keeps a Bignum year)
- `packages/ruby-compat/src/psych/scalar-scanner.ts` `parseTime` tz digits (`scalar_scanner.rb` `parse_time`)
- `packages/activerecord/src/mysql2/client.ts` connect/read/write timeouts
- `packages/activestorage/src/analyzer/video-analyzer.ts` `displayHeightScale` (`Float(x) / Integer`, `video_analyzer.rb`)

and `audio-analyzer.ts` `bitRate`/`sampleRate`, `video-analyzer.ts` `angle`/`displayAspectRatio` publish `number | bigint`.

## Acceptance criteria

- [ ] Each site carries the Ruby Integer through (`number | bigint`) where Ruby keeps a Bignum (Time's year), or uses Ruby's own Integer→Float coercion arm (`Integer#to_f` / `Float#/` coercion) where Ruby mixes with a Float, with no bare `Number(...)` narrowing left.
- [ ] Analyzer readers' types match what Ruby returns.
