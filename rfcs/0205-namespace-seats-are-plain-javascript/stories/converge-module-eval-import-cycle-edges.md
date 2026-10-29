---
title: "converge-module-eval-import-cycle-edges"
status: draft
updated: 2026-10-29
rfc: "0205-namespace-seats-are-plain-javascript"
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

`pnpm parity:import-cycles` (trails#9434, `scripts/parity/import-cycles.ts`) lists every import edge inside an import cycle whose imported binding is read while the importing module body runs: an `extends`, a static initializer, a top-level call or `new`, a decorator, or a computed member name. Each such edge can throw `Cannot access 'X' before initialization` when the cycle is entered at the other module (CLAUDE.md § "Call-time constant resolution"). `scripts/parity/import-cycles-mark.json` lists the edges below, each owned by this story; the list only shrinks.

Edges at filing (`file:line of the first module-eval read -> imported module [names read]`):

```text
packages/activerecord/src/pg/pg.ts:20 -> packages/activerecord/src/pg/connection.ts  [connect]
packages/activerecord/src/pg/pg.ts:16 -> packages/activerecord/src/pg/result.ts  [PGResult]
packages/activerecord/src/relation.ts:2117 -> packages/activerecord/src/relation/calculations.ts  [Calculations]
packages/activerecord/src/relation.ts:2116 -> packages/activerecord/src/relation/spawn-methods.ts  [SpawnMethods]
packages/activesupport/src/core-ext/date-and-time/calculations.ts:487 -> packages/activesupport/src/core-ext/date-and-time/calculations.ts  [DateAndTimeCalculations]
packages/activesupport/src/core-ext/date-time/calculations.ts:284 -> packages/activesupport/src/core-ext/date-time/conversions.ts  [nsec]
packages/activesupport/src/core-ext/date/calculations.ts:243 -> packages/activesupport/src/core-ext/date-and-time/calculations.ts  [DAYS_INTO_WEEK]
packages/activesupport/src/i18n.ts:8 -> packages/activesupport/src/locale/en.ts  [en]
packages/activesupport/src/inflector.ts:267 -> packages/activesupport/src/inflector.ts  [Inflector]
packages/activesupport/src/logger.ts:110 -> packages/activesupport/src/logger-thread-safe-level.ts  [LoggerThreadSafeLevel]
packages/activesupport/src/time-zone-config.ts:19 -> packages/activesupport/src/core-ext/date-and-time/zones.ts  [inTimeZone]
packages/activesupport/src/xml-mini.ts:502 -> packages/activesupport/src/xml-mini/rexml.ts  [XmlMini_REXML]
packages/et-orbi/src/et-orbi.ts:29 -> packages/et-orbi/src/info.ts  [_makeInfo, platformInfo, renderNozoneTime]
packages/et-orbi/src/et-orbi.ts:32 -> packages/et-orbi/src/make.ts  [isChronicEnabled, make, makeTime, now, parse, setChronicEnabled]
packages/i18n/src/backend/simple.ts:120 -> packages/i18n/src/backend/base.ts  [Base]
packages/image-processing/src/builder.ts:44 -> packages/image-processing/src/chainable.ts  [Chainable]
packages/nokogiri/src/html5/document.ts:95 -> packages/nokogiri/src/xml/searchable.ts  [Searchable]
packages/nokogiri/src/html5/node.ts:201 -> packages/nokogiri/src/xml/searchable.ts  [Searchable]
packages/nokogiri/src/xml/node-set.ts:99 -> packages/nokogiri/src/xml/searchable.ts  [Searchable]
packages/nokogiri/src/xml/node.ts:98 -> packages/nokogiri/src/xml/searchable.ts  [Searchable]
packages/ruby-compat/src/string/method-table.ts:140 -> packages/ruby-compat/src/string/byte-methods.ts  [rbStrBytesplice, rbStrSetbyte]
packages/ruby-compat/src/string/method-table.ts:131 -> packages/ruby-compat/src/string/each.ts  [rbStrBytes, rbStrChars, rbStrCodepoints, rbStrEachByte, rbStrEachChar, rbStrEachCodepoint, rbStrEachGraphemeCluster, rbStrEachLine, rbStrGraphemeClusters, rbStrLines, rbStrUpto]
packages/ruby-compat/src/string/method-table.ts:125 -> packages/ruby-compat/src/string/sub.ts  [rbStrMatchM, rbStrMatchMP, rbStrScan, rbStrSub, rbStrSubBang]
packages/solid-queue/src/blocked-execution.ts:10 -> packages/solid-queue/src/execution.ts  [Execution]
packages/solid-queue/src/claimed-execution.ts:18 -> packages/solid-queue/src/execution.ts  [Execution]
packages/solid-queue/src/failed-execution.ts:13 -> packages/solid-queue/src/execution.ts  [Execution]
packages/solid-queue/src/failed-execution.ts:21 -> packages/solid-queue/src/execution/dispatching.ts  [Dispatching]
packages/solid-queue/src/job.ts:84 -> packages/solid-queue/src/job/executable.ts  [Executable]
packages/solid-queue/src/ready-execution.ts:8 -> packages/solid-queue/src/execution.ts  [Execution]
packages/solid-queue/src/scheduled-execution.ts:12 -> packages/solid-queue/src/execution.ts  [Execution]
packages/solid-queue/src/scheduled-execution.ts:20 -> packages/solid-queue/src/execution/dispatching.ts  [Dispatching]
```

## Acceptance criteria

- Each edge is converged: the module-eval read moves into a function body, the cycle is broken, or the read goes through a namespace seat per § "Call-time constant resolution".
- Each converged edge's row is removed from `scripts/parity/import-cycles-mark.json` with `pnpm parity:import-cycles:tighten`; the file ends with an empty `edges` list.
- Verified per CLAUDE.md by a plain-node import of the built `dist/**.js` of both ends of each converged edge as entry modules.
