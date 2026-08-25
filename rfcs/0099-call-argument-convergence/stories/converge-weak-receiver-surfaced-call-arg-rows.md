---
title: "converge-weak-receiver-surfaced-call-arg-rows"
status: done
updated: 2026-08-14
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6500
claim: "2026-08-14T00:27:08Z"
assignee: "converge-weak-receiver-surfaced-call-arg-rows"
blocked-by: null
closed-reason: null
---

## Context

`call-args-weak-receiver-sites-excluded-from-population` (this PR) stopped
`compare.ts#checkCallArgs` dropping every `weak` Ruby call site: a weak site is
now kept when the compared Ruby file declares a method of that name (so the
receiver is a ported collaborator) AND the TS body still has an unconsumed
same-named site. The compared population grew 5731 → 5885 sites.

Seven PRE-EXISTING call-argument divergences surfaced with it. They are ported
bodies that already passed a different argument list than Rails; the gate simply
could not see them before. Each was baselined with a
`Baseline (RFC 0099): pre-existing call-ARGUMENT divergence, newly COMPARED …`
reason under `scripts/api-compare/call-mismatches-exclude/`:

| package        | ts file                          | ruby method                                      | call          | Rails args                | port args                                    |
| -------------- | -------------------------------- | ------------------------------------------------ | ------------- | ------------------------- | -------------------------------------------- |
| actiondispatch | `http/request.ts`                | `parse_formatted_parameters` (`http/request.rb`) | `call`        | `ref:rawPost`             | `ref:_paramsHost, ref:parsers, ref:fallback` |
| activerecord   | `relation.ts:5791`               | `update` (`relation.rb:621`)                     | `update`      | `ref:id, ref:attributes`  | `ref:updates`                                |
| activerecord   | `relation.ts:5809`               | `update!` (`relation.rb:629`)                    | `update!`     | `ref:id, ref:attributes`  | `ref:updates`                                |
| activesupport  | `testing/time-helpers.ts`        | `travel_to` (`testing/time_helpers.rb`)          | `stub_object` | `const:Time, str:now`     | `ref:clock, str:now`                         |
| activesupport  | `testing/time-helpers.ts`        | `travel_to`                                      | `stubbing`    | `const:Time, str:now`     | `ref:clock, str:now`                         |
| rack           | `multipart/parser.ts`            | `read_data` (`multipart/parser.rb`)              | `read`        | `ref:bufsize, ref:outbuf` | `ref:bufsize`                                |
| trailties      | `source-annotation-extractor.ts` | `enumerate`                                      | `display`     | `ref:find, ref:options`   | `ref:results, kwargs{tag=ref:tag}`           |

`relation.rb:621` is the sharpest: Rails' `update(id = :all, attributes)` branches
on the `:all` sentinel, while the port branches on `id === undefined`/an object
argument — a real signature divergence, not a pairing artifact.

## Acceptance criteria

- [ ] Each row's TS body passes what Rails passes at that call site (or, where a
      body's whole signature diverges, converges the signature first).
- [ ] Every one of the seven baseline rows is DELETED from
      `scripts/api-compare/call-mismatches-exclude/` (only-shrink; delete by
      hand, never `--write`).
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` green.
- Split across PRs by package if it does not fit one LOC budget.
