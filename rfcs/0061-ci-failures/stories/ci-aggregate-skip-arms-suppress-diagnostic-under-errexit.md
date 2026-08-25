---
title: "ci aggregate skip arms exit under set -e before printing the diagnostic"
status: done
updated: 2026-08-03
rfc: "0061-ci-failures"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 5985
claim: "2026-08-03T16:30:48Z"
assignee: "ci-aggregate-skip-arms-suppress-diagnostic-under-errexit"
blocked-by: null
closed-reason: null
---

## Context

The `ci` aggregate's skip-diagnostic loop (`.github/workflows/ci.yml`, "Fail if
any required job failed, was cancelled, or unexpectedly skipped") runs under
`set -euo pipefail`. Most `case` arms end with:

```sh
[ "$SOME_AFFECTED" = "false" ] && continue
```

When the test is FALSE — i.e. the skip is genuinely unexpected, the one case the
loop exists to report — the `&&` list returns 1 as the arm's last command, so
`set -e` exits the step immediately. The `echo "Unexpectedly skipped job: ..."`
diagnostic below the `esac` never prints. The run still fails (correct outcome)
but with no indication of which job or which gate misfired.

PR #5749 fixed this for `sqlite-tests` and `postgres-tests|maria-tests` by
switching to the `if ... continue; fi` form already used by `sqlite-mem-tests`
and `leaf-tests`. The remaining arms still use the fragile form:
`actionpack-tests`, `trailties-tests`, `unit-tests`, `guides-typecheck`,
`rails-comparison`, and the parity arm.

## Acceptance criteria

- [ ] Every arm in that `case` uses the `if ... then continue; fi` form.
- [ ] A deliberately-unexpected skip prints `Unexpectedly skipped job: <name>`
      with the gate values before the step exits non-zero (verify by forcing one
      gate false in a scratch branch, or by unit-testing the extracted loop).
- [ ] No behaviour change on the legitimate-skip and all-green paths.
