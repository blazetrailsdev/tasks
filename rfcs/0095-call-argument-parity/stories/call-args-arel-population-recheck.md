---
title: "call-args-arel-population-recheck"
status: done
updated: 2026-08-10
rfc: "0095-call-argument-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6343
claim: "2026-08-10T15:43:28Z"
assignee: "call-args-arel-population-recheck"
blocked-by: null
closed-reason: null
---

## Context

RFC 0095 AC4 on `call-args-normalize-and-compare` asks the comparator to
reproduce the spike's arel population — "302 comparable sites, ~70 flagged" —
within a small delta. It could not be checked in PR #6309, and the reason is
structural rather than a comparator defect: the spike (2026-08-08, worktree
`api-calls-args-spike-892491`) measured with its own throwaway Ripper walker and
`typescript` AST walker, and RFC 0095's Provenance records that **no trails code
was written** for it. The shipped descriptor streams come from different code —
`extract-ruby-api.rb#describe_args` (`ruby-extractor-emit-call-arguments`, PR #6303-era) and `extract-ts-api.ts#describeArgs` (`ts-extractor-emit-call-arguments`, #6304) — so the site population is not the same population the spike counted.

Measured in #6309 over arel (324 name-matched pairs in
`output/call-skeletons.json`, 293 with `callArgs` on both sides), across four
candidate site-pairing policies, all with the same comparator:

| policy                      | comparable | match | flagged |
| --------------------------- | ---------: | ----: | ------: |
| strict index + equal length |        115 |   103 |      12 |
| strict index                |        217 |   167 |  **50** |
| unique name                 |        213 |   160 |      53 |
| forward scan                |        389 |   291 |      98 |

The comparator itself reproduces the spike: the strict-index match RATE is
76.9% against the spike's recorded 76.8%, and every finding the RFC names is
present — all of the `collect_nodes_for` / `inject_join` / `infix_value` /
`grouping_parentheses` rows with `collector` moved last (a1), `build_quoted`'s
swapped pair, and the `visit_edge` label drift in `dot.rb` (a3). What varies by
±3x is the site-pairing policy, and that policy is `call-args-artifact-and-report`'s
AC — it reuses the name-matched pair `checkCalls` / `checkLiterals` already
receive, rather than any of the four above.

So the number is only checkable once the artifact exists. This story is that
check.

## Acceptance criteria

1. With `call-args-artifact-and-report` merged, record the arel population from
   `output/call-arg-mismatches.json` (`compared`, `mismatched`, and the
   `shape` / `naming` split) under the shipped pairing.
2. Compare against the spike's 302 / ~70 and state the delta, with the
   extractor difference above as the accounting for it.
3. If the shipped population is materially different, RFC 0095's "Measured
   signal" table is updated to the shipped numbers, so later stories
   (`call-args-baseline-seed`, `call-args-naming-dimension-disposition`) size
   themselves against a number a clean tree actually produces.
4. No comparator behavior change is in scope here — if the re-measurement
   surfaces a normalization defect, it is filed separately.
