# Reflection: Explore, Plan, Implement, Commit

This draft covers my Part 2 work on the repo import page. Eileen will add the Part 1 and Part 3 sections.

## How this workflow compares with how I used to work

Before this assignment, we moved from a plan straight into coding. We did not stop for this many rounds of review. We talked about planning before writing, but in Cursor the two steps were not strictly separated. Planning and editing happened in the same flow, so it was easy to start changing files before the approach was settled.

Claude Code makes the split explicit. I had to press Shift+Tab and switch into plan mode before Claude was allowed to treat the design as ready. In that mode it could read the repo and propose a plan, but it did not edit the project until I approved the plan. I also stayed in manual mode instead of auto mode, so each file write stopped and waited for me. I read what it was about to change, then chose Yes. There were more confirmations than I was used to, but that kept us aligned. When I rejected a write by accident, nothing was changed, and I could tell it to continue. The three pieces landed as separate commits: the GitHub client (d17de2a), importRepo (3c057e6), and the /import page (42f7b6e). I checked the running page before we pushed. A real repository showed 26 kept files, and an http:// URL showed the expected error.

In class we were told to spend most of our time planning instead of jumping into implementation. This workflow made that advice concrete. Explore was only for reading. Plan mode was only for the design. Implementation started after the plan was saved.

## Which context practices helped

Plan mode was the most useful practice. It forced a pause between understanding the code and editing it. During the explore step I told Claude not to write code. It read lib/rules, the app, and the Next.js docs, then reported that parseGitHubUrl, shouldIgnorePath, and filterRepoFiles already existed and listed what the page still needed. That list became the plan, instead of Claude inventing a design while it was already editing.

Saving the plan as docs/plans/repo-import-page.md was more reliable than leaving it in the chat. A chat can be compacted or forgotten. The file stayed in the repo as commit e2292c2, and the later commits followed it. Manual approval did the same job at a smaller scale. Each Yes was a check that the diff still matched the plan.
