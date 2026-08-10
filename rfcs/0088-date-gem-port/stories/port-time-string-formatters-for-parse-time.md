---
title: "Port Time#to_s/asctime/iso8601/rfc2822/httpdate/xmlschema and test_parse__time"
status: done
updated: 2026-08-10
rfc: "0088-date-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 260
priority: null
pr: 6336
claim: "2026-08-10T13:53:22Z"
assignee: "port-test-date"
blocked-by: null
closed-reason: null
---

## Context

`packages/date/src/time.ts` ports `Time`'s readers (`year`, `mon`, `usec`,
`nsec`, `subsec`, `zone`, `utcOffset`, `strftime`, the three `to_*`
converters) but none of its string formatters. Ruby's `Time#to_s`
(`vendor/date/../time.c` `time_to_s`) and `Time#asctime` are core, and
`require 'time'` adds `#iso8601`, `#rfc2822`, `#httpdate` and `#xmlschema`.

`test_parse__time` (`vendor/date/test/date/test_date_parse.rb:605-624`) drives
`DateTime.parse` over all six spellings for both a UTC and a local `Time`, so
the test cannot be written until they exist. It was deferred out of PR #6322
for that reason.

## Converged shape

Port the six onto `packages/date/src/time.ts` at the Ruby names
(`toS`, `asctime`, `iso8601`, `rfc2822`, `httpdate`, `xmlschema`), each
against its Ruby source, then port `test_parse__time` into
`packages/date/src/test-date-parse.test.ts` as `parse  time`
(`scripts/test-compare/extract-ruby-tests.rb:514`: strip `test_`, then
`tr("_", " ")`).

## Acceptance criteria

- [ ] The six formatters exist on `Time` under their Ruby names.
- [ ] `test_parse__time` lands and `pnpm parity:test --package date` credits
      it; no other package regresses.
