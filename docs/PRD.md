# OwnYourCode PRD

**Team:** [Eileenyuan1](https://github.com/Eileenyuan1) · [RipZou](https://github.com/RipZou)

## 1. Problem & Solution

Students who build projects with AI tools often can't explain their own code in interviews ("Why JWT instead of sessions?"). Existing mock-interview tools ask generic questions or only read the README.

OwnYourCode imports a public GitHub repo, has an AI agent explore the real code, and helps the user learn and practice explaining it:

- **Learn mode:** the agent explains each topic using the user's code.
- **Mock Interview mode:** the agent asks questions and checks answers against the code.
- **Mastery tracking:** both modes update a per-topic score; weak topics are recommended.
- **Peer Mock:** the student invites a classmate to play the interviewer, using AI-generated questions and reference answers.

**Non-goals (MVP):** voice or video (peer mocks run over the users' own call), private repos, real-time collaboration, LeetCode-style practice, analytics charts.

## 2. Core Concepts

- **Repository:** an imported public GitHub repo.
- **Knowledge map:** 4 to 8 topics generated once per repo (e.g., Auth, Database, API).
- **Topic:** title, summary, and file references.
- **Mastery score:** 0 to 100 per user per topic.
- **Session:** one Learn, AI Mock, or Peer Mock session, owned by one candidate.
- **Reference answer:** the AI's expected answer to an interview question, with citations.
- **Citation:** a file (optionally a line range) in the repo, e.g. `src/lib/auth.ts:20-35`.

## 3. Roles

| Role | Can | Cannot |
|---|---|---|
Both roles are students. Roles are per Peer Mock session, so the same person can be a candidate on their own repo and an interviewer for a classmate.

| Role | Can | Cannot |
|---|---|---|
| **Candidate** (repo owner) | Import repos, use Learn and AI Mock, create Peer Mock sessions and invite links, revoke the interviewer, view all own results | See reference answers before the Peer Mock session is completed, rate own answers |
| **Interviewer** (invited classmate) | Open the invited session, see its questions and reference answers, rate each answer and add notes, complete the session | See the candidate's other sessions or mastery, invite others, access the session after being revoked |

Without a classmate, a student uses AI Mock alone.

## 4. Features & Acceptance Criteria

**F1 Auth:** Sign in/out (GitHub via Auth.js, login only). Unauthenticated users can't access repo or session pages.

**F2 Repo Import:** Accepts `https://github.com/{owner}/{repo}`; invalid URLs show an error. Applies the filter and size rules (§5.1). Re-importing the same repo reuses it.

**F3 Knowledge Map:** The agent generates 4 to 8 topics, each with ≥1 valid citation. Generated once per repo.

**F4 Learn Mode:** Explanations and follow-up answers each cite ≥1 valid file. Each topic ends with a 2 to 3 question quiz that updates mastery.

**F5 AI Mock Interview:** ~5 grounded questions, with follow-ups when an answer is vague. Each answer is marked **consistent / contradicts code / unclear**, with a citation. Completed sessions are read-only. The final report shows the score per question, contradictions with file links, and weak topics.

**F6 Mastery:** Scores are updated per §5.2. Weak topics are recommended in Learn mode.

**F7 Peer Mock:** The candidate creates a Peer Mock session and shares an invite link. The AI prepares about 5 questions, each with a reference answer and citations. The interviewer asks the questions over their own call and rates each answer **correct / partial / incorrect** with an optional note. Ratings update the candidate's mastery (§5.2). After completion, the candidate sees the ratings, notes, and reference answers. Access rules are in §5.4.

## 5. Business Rules (TDD targets)

### 5.1 Repo import
- Host must be `github.com`; the path must be `/{owner}/{repo}`.
- Ignore: `node_modules/`, `.git/`, `dist/`, `build/`, `.next/`, lock files, images, videos, fonts, binaries.
- Files larger than 100 KB are skipped.
- More than 200 files after filtering → reject with an explanation.

### 5.2 Mastery score
- Start at 0 ("not started").
- Consistent/correct: +10 · unclear/partial: +3 · contradicts/incorrect: −10.
- Always clamped to [0, 100].
- Weak = below 40 after at least one attempt.

### 5.3 Sessions
- `not_started → in_progress → completed`.
- In AI Mock, only the candidate can submit answers; completed sessions reject answers.

### 5.4 Peer Mock access
- Only the candidate can create a Peer Mock session and its invite link.
- Invite links are random and expire after 7 days.
- A session has at most one interviewer; later joins are rejected.
- The candidate can't be the interviewer of their own session.
- Only the interviewer can rate answers; completed sessions are read-only.
- The candidate can't see reference answers until the session is completed.
- The interviewer can see only that session, never the candidate's other sessions or mastery.
- The candidate can revoke the interviewer at any time; access is lost immediately.

## 6. AI Design

- **Agent tools:** `list_files(path)`, `read_file(path)`, `search_code(query)`.
- **Grounding:** every explanation, question, and verdict needs ≥1 citation to a file that exists in the repo; responses with invalid citations are regenerated.
- **Answer verification (AI Mock):** extract the claims in the answer → check each against the code with the tools → return a verdict with citations.
- **Cost/limits:** repo size limits, knowledge map cached per repo, per-user rate limit, one request per interview turn (serverless time limits).
- **Safety:** repo contents are untrusted; instructions inside the files must not change agent behavior.

## 7. Security

- Every API route checks access to the repo or session (OWASP A01).
- Secrets only in env vars.
- AI endpoints require sign-in and are rate limited.

## 8. Tech Stack

Next.js 16 (App Router) + TypeScript · PostgreSQL + Prisma · Auth.js · Claude Agent SDK · Vercel · Vitest (unit/integration, mocked AI) · Playwright (E2E)
