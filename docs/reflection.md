# Reflection: Explore, Plan, Implement, Commit

Annotated log: [session-log.md](session-log.md).

## 1. Compared with our previous approach

**Planning and coding are now separate steps.** We used to move from a plan straight into code. In Cursor, planning and editing happened in one flow, so files often changed before the approach was settled. Claude Code makes the split explicit. Explore was read only. Plan mode could read and propose, but not edit. Implementation started only after the plan was saved to docs/plans/repo-import-page.md. The page then landed as three reviewable commits: GitHub client (d17de2a), importRepo (3c057e6), and the /import page (42f7b6e).

**Tests became the spec.** We used to ask for a whole feature and test afterwards. Writing failing tests first forced decisions the PRD had left open: is a trailing slash allowed, is a file of exactly 100 KB kept, do skipped files count toward the 200 file limit. Each decision went into PRD §5.1 before any code existed, and Claude's job shrank to the minimum code that passes. Diffs stayed small and easy to review.

**Review is still required.** All 17 URL tests were green while https://github.com//repo was still accepted with an empty owner. Code review found it, and we fixed it test first (cdb15c4, b5659c6). The permission setup was a bigger warning: Claude invented a "bashCommands" format that Claude Code does not support and said the rules appeared to work. We caught it by reading the official docs and retesting in default mode, since auto mode can approve commands on its own. We now treat "done" from Claude as a claim to verify.

**Manual approval kept us aligned.** We stayed out of auto mode, so every file write paused for review. There were more confirmations than we were used to, but each one was a check that the diff still matched the plan, and an accidental rejection changed nothing.

## 2. Context management that worked

**Imports instead of copies.** The first /init output pasted most of the PRD into CLAUDE.md. Replacing it with @docs/PRD.md and @AGENTS.md keeps one source of truth.

**Decisions in files, not chat.** Every TDD edge case was committed to PRD §5.1, and the Part 2 plan was committed as a file (e2292c2). This made /clear safe: a fresh session rebuilds context from the repo, not from an old conversation.

**/clear per task, /compact with a focus.** Each task started with /clear. In the long TDD session, /compact focused on the import rules, the TDD steps and the commit style; Claude then reread the source, tests and PRD and kept the same pattern without repetition.

**Plan mode as a checkpoint.** Plan mode forced a pause between understanding the code and changing it. The explore step found that parseGitHubUrl, shouldIgnorePath and filterRepoFiles already existed, and that list became the plan.

**Choose sessions explicitly.** claude --resume reopened the /init session to export its log. claude --continue once opened a different, more recent session, so we now pick from the --resume list.

## Takeaway

Planning first and testing first did not reduce review. They made each review smaller: a plan to approve, a test to read, a short diff to check. Every mistake we caught (an invented config format, a broken style rule, a missed edge case) was caught at one of those checkpoints.
