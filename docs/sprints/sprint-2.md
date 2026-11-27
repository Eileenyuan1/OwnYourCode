# Sprint 2

**Status:** Planned. Not started.
**Goal:** Let a signed-in student import a public repo and import the same repo again without creating a second copy.
**Issues:** [#9](https://github.com/Eileenyuan1/OwnYourCode/issues/9) and [#10](https://github.com/Eileenyuan1/OwnYourCode/issues/10), both in Ready.

## Planning

Sprint 1 can show kept files, and it does not know who imported them. PRD F1 and the rest of F2 are the next slice.

In scope:

- GitHub sign-in and sign-out through Auth.js. Login is the only account action.
- Unsigned visitors cannot open repo or session pages.
- A successful import is stored for the signed-in user.
- Importing the same owner and repo again reuses that record.
- Invalid URLs and repos rejected by §5.1 do not create a record.

Out of scope for this sprint: the knowledge map, mastery, Learn mode, AI Mock, and Peer Mock. Those are issues #11 through #15.

## Branch plan

One issue, one branch, one pull request.

- `feat/github-sign-in` for #9.
- `feat/save-imported-repo` for #10. Start it after #9, because saving a repo needs a signed-in user.

## Retrospective

None yet. Write it when both issues are merged.

## Standups

Add real messages here during the sprint. Three per person.

### Eileen

- 
- 
- 

### RipZou

- 
- 
- 
