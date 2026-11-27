# Sprint 1

**Dates:** 24 to 25 November 2026
**Goal:** Finish HW4 on OwnYourCode: Claude Code setup, the §5.1 import rules, and the public import page.
**Board:** [OwnYourCode project](https://github.com/users/RipZou/projects/4)
**Issues:** [#7](https://github.com/Eileenyuan1/OwnYourCode/issues/7) and [#8](https://github.com/Eileenyuan1/OwnYourCode/issues/8), both closed.

## Planning

The sprint started from [docs/PRD.md](../PRD.md). The page work was planned in [docs/plans/repo-import-page.md](../plans/repo-import-page.md) before implementation, and that plan was committed as `e2292c2`.

The planned slice was:

- Keep the §5.1 rules as tested pure functions.
- Add a page that accepts a public GitHub URL, fetches the file tree, applies those rules, and shows the kept files or an error.
- Leave sign-in and the database out of this slice.

## What shipped

- Repo import rules, merged in PRs #1, #2, and #3. Failing tests were committed before the implementation.
- The `/import` page, merged in PR #4. Checked in the browser with `https://github.com/Eileenyuan1/ownyourcode` (26 files kept) and `http://github.com/a/b` (URL error).
- HW4 notes: session logs, the annotated session log, and [the HW4 reflection](../hw4-reflection.md), merged in PRs #5 and #6.

## Retrospective

This section records points already written in the HW4 reflection. It does not add new events.

- Plan mode and manual approval made planning and editing separate steps. That took more confirmations and avoided rewriting finished work.
- Writing failing tests first turned open PRD questions into decisions before any implementation.
- A green test run still missed the empty-owner bug. Reading the code, then adding a failing test, caught it.
- Claude invented a permissions format once. Checking the official docs caught it. Auto mode would have hidden that check.
- `CLAUDE.md`, `@docs/PRD.md`, and the committed plan were more reliable than leaving decisions only in the chat.

## Standups

Async standups were not copied into the repo during this sprint. Paste the real messages below. Do not write messages that were never sent.

### Eileen

- 
- 
- 

### RipZou

- 
- 
- 
