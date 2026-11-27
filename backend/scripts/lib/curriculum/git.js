/**
 * Git & GitHub for Teams
 *
 * Version control as a team practice: commits people can review, branches that
 * stay short, and recovery when something goes wrong.
 */

const q = (prompt, correct, wrong, explanation) => ({ prompt, correct, wrong, explanation });

const t = (lead, objectives, sections, example, mistakes, practice, summary, questions) => ({
  lead,
  objectives,
  sections,
  example,
  mistakes,
  practice,
  summary,
  questions,
});

const topics = {
  'why-version-control': t(
    'Version control records the history of a project so you can compare, revert and collaborate. Git stores snapshots locally, which makes most operations fast and offline.',
    ['explain what a commit contains', 'describe the three areas of a Git repository', 'recognise why distributed history matters'],
    [
      ['Snapshots, not diffs', 'A commit records the state of the tracked files plus a pointer to the parent commit and metadata. Git stores content by hash, so identical files are shared. That design makes branching cheap: a branch is a pointer to a commit, not a copy of the project.'],
      ['Working tree, index, repository', 'You edit the working tree, stage selected changes into the index, then commit the index as a snapshot. The index is what allows a commit to contain part of your work, which is how you keep a change focused when several edits are in progress.'],
    ],
    {
      lang: 'bash',
      code: `git status          # working tree vs index vs HEAD
git add src/api.js  # stage one file
git commit -m "Validate course price on create"

# A commit is a snapshot plus:
# - parent commit hash
# - author and committer
# - message`,
      output: '[main 4f2c1a9] Validate course price on create\n 1 file changed, 12 insertions(+), 3 deletions(-)',
      explain: 'Only the staged file is in the commit, even if other files were edited.',
    },
    [
      'Committing everything with git add . so unrelated changes end up in one review.',
      'Treating the repository as a backup rather than a history of decisions.',
    ],
    {
      prompt: 'Make two unrelated edits, stage only one and commit it, then inspect the difference.',
      steps: ['Edit two files.', 'Stage one with git add.', 'Commit and run git show --stat.'],
    },
    [
      'A commit is a snapshot with a parent pointer.',
      'The index lets you commit part of your work.',
      'Branches are cheap pointers to commits.',
    ],
    [
      q('What does a commit point to?', 'A snapshot of the tracked files and its parent commit', ['A diff only', 'A remote server', 'A branch name'], 'History is a chain of snapshots.'),
      q('What is the index for?', 'Staging the exact changes that go into the next commit', ['Storing remote branches', 'Compressing files', 'Resolving conflicts'], 'It separates editing from committing.'),
    ],
  ),

  commits: t(
    'A commit should be one coherent change with a message that explains why. Small commits are easier to review, revert and understand months later.',
    ['stage changes precisely', 'write a commit message that explains why', 'keep commits atomic'],
    [
      ['Atomic commits', 'A commit that fixes one bug and reformats a file cannot be reverted cleanly, because reverting also undoes the formatting. Split unrelated work into separate commits with git add -p, which stages individual hunks. The history then reads as a sequence of decisions.'],
      ['Message shape', 'The subject line states what changed in the imperative, under about 72 characters. The body explains why, and what the alternative was. "Fix bug" tells a future reader nothing; "Reject a negative price on course create" tells them what behaviour changed.'],
    ],
    {
      lang: 'bash',
      code: `git add -p src/courses.service.ts
git commit -m "Reject a negative price on course create" \\
           -m "The API accepted -10 and stored it, which broke
the order total. Validation now runs before the write so
the client receives a 400 with the field name."`,
      output: '[main 8d1e0c4] Reject a negative price on course create',
      explain: 'The subject is imperative and short; the body records the reason and the expected behaviour.',
    },
    [
      'Committing "wip" and planning to clean it up later, which never happens.',
      'Mixing a refactor with a behaviour change, so a revert breaks both.',
    ],
    {
      prompt: 'Split a mixed change into two atomic commits using git add -p.',
      steps: ['Make a refactor and a fix.', 'Stage the refactor hunks.', 'Commit each with a why-focused message.'],
    },
    [
      'One commit should do one thing.',
      'git add -p stages individual hunks.',
      'The body explains why, not what.',
    ],
    [
      q('Why split a refactor from a behaviour change?', 'Each can be reviewed and reverted independently', ['It reduces repository size', 'Git requires it', 'It avoids merge conflicts'], 'A mixed commit cannot be reverted partially.'),
      q('What should a commit subject describe?', 'The change in the imperative, briefly', ['The files touched', 'The author', 'The branch name'], 'The body carries the reasoning.'),
    ],
  ),

  history: t(
    'History is a tool for answering questions: when did this change, who changed it and why. Git offers a few commands that answer most of them quickly.',
    ['read history with log, show and diff', 'find the commit that introduced a line', 'compare branches and revisions'],
    [
      ['Reading a log', 'git log --oneline --graph --decorate shows the shape of history in one screen. Adding -S"term" finds commits that added or removed a string, which is often faster than reading every diff. git show displays one commit with its patch.'],
      ['Blame is a starting point', 'git blame annotates each line with the last commit that touched it. It identifies a commit to read, not a person to blame: a line may have moved, been reformatted or been changed by a rename. Follow the commit and read its message and diff.'],
    ],
    {
      lang: 'bash',
      code: `git log --oneline --graph --decorate -n 12
git log -S"passScore" --oneline
git show 4f2c1a9 -- src/quiz.service.ts
git diff main...feature/quiz-retake --stat
git blame -L 40,60 src/quiz.service.ts`,
      output: '4f2c1a9 Set quiz pass score to 8 of 10',
      explain: 'The -S search finds the commit that introduced the value without reading every diff.',
    },
    [
      'Reading a blame line as proof of authorship of the current logic.',
      'Comparing branches with two dots when you mean the changes since they diverged.',
    ],
    {
      prompt: 'Find the commit that introduced a specific function name, then read its message and diff.',
      steps: ['Run git log -S with the name.', 'Open the commit with git show.', 'Summarise why it was added.'],
    },
    [
      'log --graph shows the shape of history.',
      '-S searches for commits that changed a string.',
      'Blame points at a commit, not a culprit.',
    ],
    [
      q('What does git log -S"term" find?', 'Commits that added or removed that string', ['Files containing the term', 'Branches named after it', 'Uncommitted changes'], 'It is a content search over history.'),
      q('How should git blame be used?', 'To find the commit that last touched a line, then read it for context', ['To identify who to blame', 'To revert a file', 'To list authors'], 'The commit explains the change.'),
    ],
  ),

  undoing: t(
    'Git offers several ways to undo, and they differ in what they do to history. Choosing the right one prevents losing work or rewriting a shared branch.',
    ['restore a file to its last commit', 'revert a published commit safely', 'know when reset is acceptable'],
    [
      ['Restore and revert', 'git restore file discards uncommitted edits to that file. git revert creates a new commit that undoes an earlier one, which is the correct tool for a shared branch because it adds history instead of rewriting it. Anyone who already pulled keeps a consistent history.'],
      ['Reset rewrites', 'git reset --hard moves the branch pointer and discards commits and working changes. It is fine on a local branch nobody else has, and destructive on a shared one. If a commit was pushed, revert it; do not reset and force push unless the team has agreed.'],
    ],
    {
      lang: 'bash',
      code: `# Discard uncommitted edits to one file
git restore src/api.js

# Undo a published commit with a new commit
git revert 8d1e0c4

# Discard local commits (only if not shared)
git reset --hard HEAD~2

# Recover after a mistaken reset
git reflog
git reset --hard HEAD@{2}`,
      output: '[main 9a7c2f1] Revert "Reject a negative price on course create"',
      explain: 'Revert adds an inverse commit, so everyone who pulled stays consistent.',
    },
    [
      'Force pushing a reset to a shared branch, which rewrites history other people already have.',
      'Using git checkout -- . to undo one file and losing every uncommitted change.',
    ],
    {
      prompt: 'Revert a commit on a branch, then confirm the original change is gone but history is intact.',
      steps: ['Pick a recent commit.', 'Run git revert.', 'Inspect the new commit and the log.'],
    },
    [
      'restore discards working changes.',
      'revert is safe on shared branches.',
      'reset rewrites history and belongs on local branches.',
    ],
    [
      q('Which command is safe for undoing a commit on a shared branch?', 'git revert', ['git reset --hard', 'git push --force', 'git clean -fd'], 'It adds an inverse commit instead of rewriting history.'),
      q('What does git restore src/api.js do?', 'Discards uncommitted changes to that file', ['Deletes the file', 'Reverts the last commit', 'Unstages the file only'], 'The file returns to its last committed state.'),
    ],
  ),

  branches: t(
    'A branch is a movable pointer to a commit. Short-lived branches isolate work, and merging combines the histories without losing either side.',
    ['create, switch and delete branches', 'merge with and without fast-forward', 'keep branches short-lived'],
    [
      ['Cheap pointers', 'Creating a branch writes one small file with a commit hash. Switching moves HEAD and updates the working tree. That is why a branch per feature is cheap and why a long-lived branch becomes expensive: the longer it lives, the more the main branch moves away from it.'],
      ['Merge types', 'A fast-forward merge moves the pointer when the target has no new commits, producing a linear history. Otherwise Git creates a merge commit with two parents. Squash merging combines the branch into one commit on main, which keeps main readable but discards the individual commits.'],
    ],
    {
      lang: 'bash',
      code: `git switch -c feature/quiz-retake
# ... commits ...
git switch main
git pull --ff-only
git merge --no-ff feature/quiz-retake
git branch -d feature/quiz-retake

# Or, on GitHub: Squash and merge`,
      output: 'Merge made by the "ort" strategy.',
      explain: '--no-ff keeps a merge commit that records the feature boundary even when a fast-forward was possible.',
    },
    [
      'Keeping a feature branch open for weeks, so the merge becomes a large conflict.',
      'Deleting a branch before confirming its commits are reachable from main.',
    ],
    {
      prompt: 'Create a branch, make two commits, merge it with --no-ff and inspect the graph.',
      steps: ['Branch from main.', 'Commit twice.', 'Merge and run git log --graph.'],
    },
    [
      'Branches are pointers, so creating one is cheap.',
      'Short branches merge easily.',
      'Squash merges trade detail for a clean main history.',
    ],
    [
      q('What is a fast-forward merge?', 'Moving the branch pointer when the target has no new commits', ['Creating a merge commit', 'Rebasing the branch', 'Squashing commits'], 'The pointer simply advances, so the history stays linear with no merge commit.'),
      q('Why keep feature branches short-lived?', 'The longer they live, the more main diverges and the harder the merge', ['Git limits branch age', 'They use disk space', 'They block pushes'], 'Small, frequent merges reduce conflict size.'),
    ],
  ),

  'merge-conflicts': t(
    'A conflict happens when two branches change the same lines. Git stops and asks you to decide, because it cannot know which intent is correct.',
    ['read conflict markers', 'resolve a conflict and complete the merge', 'reduce conflicts before they happen'],
    [
      ['Markers are a question', 'The file contains <<<<<<<, ======= and >>>>>>> sections showing your side and theirs. Edit the file into the result you want, delete the markers, then git add the file and continue the merge. Leaving a marker in the file is a bug that ships.'],
      ['Prevent, then resolve', 'Most conflicts come from long branches and broad formatting changes. Pull main into the branch frequently, keep commits small and agree on a formatter so whitespace does not create noise. When a conflict is genuinely semantic, talk to the other author before choosing.'],
    ],
    {
      lang: 'bash',
      code: `git merge main
# CONFLICT (content): Merge conflict in src/quiz.service.ts

# edit the file, keep the intended result, remove markers
git add src/quiz.service.ts
git commit            # completes the merge

# Abandon the merge and start over
git merge --abort`,
      output: '[main 2b7d9e0] Merge branch \'main\' into feature/quiz-retake',
      explain: 'Staging the resolved file tells Git the conflict is settled.',
    },
    [
      'Choosing "ours" or "theirs" for the whole file without reading either change.',
      'Committing a file that still contains conflict markers.',
    ],
    {
      prompt: 'Create a deliberate conflict on two branches, resolve it by combining both changes and commit.',
      steps: ['Edit the same line on two branches.', 'Merge and read both sides.', 'Write the combined result and stage it.'],
    },
    [
      'Markers show two intents, not an error.',
      'Resolve, stage, then commit.',
      'Small branches and frequent pulls prevent most conflicts.',
    ],
    [
      q('What must you do before committing a resolved conflict?', 'Remove the markers and stage the resolved file', ['Delete the branch', 'Run git reset', 'Force push'], 'Git commits whatever is staged, markers included.'),
      q('How can conflicts be reduced?', 'Keep branches short and pull main regularly', ['Disable merging', 'Use one branch', 'Commit less often'], 'Small divergences produce small conflicts.'),
    ],
  ),

  rebase: t(
    'Rebase replays your commits on top of another branch. It produces a linear history, at the cost of rewriting commit hashes, which matters on shared branches.',
    ['rebase a feature branch onto main', 'squash commits interactively', 'know when rebasing is unsafe'],
    [
      ['Replaying commits', 'git rebase main takes each commit unique to your branch, applies it on top of main and moves the branch pointer. The result looks as if you started from the latest main. Because the commits are new objects with new hashes, anyone who based work on the old ones now has a diverged history.'],
      ['Interactive rebase', 'git rebase -i HEAD~4 opens a list where you can reword, squash or drop commits. It is the standard way to turn a messy local branch into a handful of reviewable commits before opening a pull request. Only rewrite commits that have not been shared.'],
    ],
    {
      lang: 'bash',
      code: `git switch feature/quiz-retake
git fetch origin
git rebase origin/main

# tidy the local branch before review
git rebase -i HEAD~4
# pick   a1b2c3 Add retake endpoint
# squash d4e5f6 Fix typo
# squash 7g8h9i Lint
# reword j1k2l3 Document retake limits

git push --force-with-lease`,
      output: 'Successfully rebased and updated refs/heads/feature/quiz-retake.',
      explain: 'force-with-lease refuses to overwrite if someone else pushed to the branch in the meantime.',
    },
    [
      'Rebasing a branch other people are working on, so their commits diverge.',
      'Using git push --force instead of --force-with-lease after a rebase.',
    ],
    {
      prompt: 'Squash three local commits into one with an interactive rebase and push with a lease.',
      steps: ['Run rebase -i HEAD~3.', 'Mark two as squash.', 'Push with force-with-lease.'],
    },
    [
      'Rebase rewrites hashes, so it is for unpublished work.',
      'Interactive rebase cleans up a branch before review.',
      'force-with-lease protects against overwriting others.',
    ],
    [
      q('Why is rebasing a shared branch dangerous?', 'It rewrites commit hashes that other people already based work on', ['It deletes commits', 'It requires a network connection', 'It creates merge commits'], 'Everyone else must recover their history.'),
      q('What does --force-with-lease check?', 'That the remote branch has not changed since your last fetch', ['That the branch is protected', 'That tests pass', 'That the commit is signed'], 'It prevents overwriting someone else\'s push.'),
    ],
  ),

  'remote-basics': t(
    'A remote is a named URL for another copy of the repository. Fetch brings its objects locally; pull fetches and integrates; push sends your commits.',
    ['add and inspect remotes', 'fetch before integrating', 'set upstream tracking'],
    [
      ['Fetch versus pull', 'git fetch downloads new commits and updates remote-tracking branches without touching your working tree. git pull is fetch plus merge or rebase. Fetching first lets you inspect what changed before deciding how to integrate, which is why it is safer in a busy repository.'],
      ['Tracking branches', 'git push -u origin feature sets the upstream, after which git push and git pull work with no arguments. Remote-tracking branches such as origin/main are read-only snapshots of the last fetch, not live views of the server.'],
    ],
    {
      lang: 'bash',
      code: `git remote -v
git fetch origin --prune
git log --oneline HEAD..origin/main     # what is new upstream
git pull --rebase origin main
git push -u origin feature/quiz-retake`,
      output: '* [new branch]      feature/quiz-retake -> feature/quiz-retake',
      explain: '--prune removes remote-tracking branches whose upstream branch was deleted.',
    },
    [
      'Running git pull with uncommitted changes and getting a merge that is hard to undo.',
      'Assuming origin/main is current without fetching; it is a snapshot.',
    ],
    {
      prompt: 'Fetch, list the commits that exist upstream but not locally, then integrate with rebase.',
      steps: ['Run git fetch --prune.', 'Inspect HEAD..origin/main.', 'Pull with --rebase.'],
    },
    [
      'fetch downloads; pull also integrates.',
      'Remote-tracking branches update only on fetch.',
      '-u sets the upstream so later commands need no arguments.',
    ],
    [
      q('What is the difference between fetch and pull?', 'pull fetches and then merges or rebases; fetch only downloads', ['fetch also commits', 'pull only downloads', 'They are identical'], 'Fetching first lets you inspect the changes.'),
      q('What is origin/main?', 'A local snapshot of main as of the last fetch', ['The live server branch', 'Your local branch', 'A tag'], 'It updates when you fetch.'),
    ],
  ),

  'pull-requests': t(
    'A pull request is a proposal to merge a branch, with a diff, a description and a review. Its size decides whether the review is useful.',
    ['open a pull request with context', 'keep a PR small and reviewable', 'link the change to an issue'],
    [
      ['The description is the argument', 'A reviewer needs to know what problem the change solves, how it solves it, and what they should look at first. A template with those three prompts produces better reviews than an empty box. Link the issue so the discussion stays connected.'],
      ['Size is the main variable', 'A 1,000-line pull request gets a superficial review because a careful one would take hours. Splitting by concern, such as schema, service and tests, produces several small reviews that each get real attention. Review latency drops as a side effect.'],
    ],
    {
      lang: 'markdown',
      code: `## What
Reject a negative price when creating a course.

## Why
Closes #482. A negative price produced a negative order total.

## How
- Validate \`price\` with a schema before the write
- Return 400 with the field name
- Add an integration test for -10

## Review first
\`src/courses/courses.service.ts\``,
      output: 'A reviewer knows the problem, the fix and where to start in under a minute',
      explain: 'The description carries the context that the diff cannot.',
    },
    [
      'Opening a PR with the title "fixes" and no description.',
      'Bundling a dependency upgrade, a refactor and a feature into one branch.',
    ],
    {
      prompt: 'Write a pull request description for a change you made this week using the four sections.',
      steps: ['State the problem and link the issue.', 'Describe the approach.', 'Point at the file to review first.'],
    },
    [
      'Context in the description reduces review time.',
      'Small PRs get careful reviews.',
      'Link the issue so discussion stays in one place.',
    ],
    [
      q('Why do large pull requests get worse reviews?', 'Reviewers cannot hold the whole change in mind, so they skim', ['GitHub limits their size', 'They take longer to open', 'They cannot be merged'], 'Small changes get line-by-line attention.'),
      q('What belongs in a PR description?', 'The problem, the approach and where to start reviewing', ['The full diff', 'The commit count', 'The author\'s CV'], 'The diff shows what; the description explains why.'),
    ],
  ),

  'code-review': t(
    'Code review is a technical conversation about a change. Clear comments, a stated priority and a timely response make it useful instead of personal.',
    ['give specific, actionable review comments', 'separate blocking issues from suggestions', 'respond to review without defensiveness'],
    [
      ['Specific and actionable', '"This is confusing" gives the author nothing to act on. "This query runs inside the loop, so it issues N+1 queries; can we include the relation?" names the problem and a direction. Point at the line and explain the consequence.'],
      ['Label the priority', 'Prefix comments with blocking, suggestion or nit so the author knows what must change before merge. Without labels, every comment looks mandatory and the review becomes a negotiation about style instead of correctness. Approve with suggestions rather than holding the PR for a preference.'],
    ],
    {
      lang: 'markdown',
      code: `**blocking** This endpoint returns 200 for a missing course.
Return 404 so the client can distinguish it from a real result.

**suggestion** Extracting the price check into a helper would
let the update path reuse it. Not required for this PR.

**nit** Typo: "recieve" -> "receive".`,
      output: 'The author knows exactly what blocks the merge and what does not',
      explain: 'Labels turn a list of opinions into a decision about what must change.',
    },
    [
      'Writing "why did you do it this way?" which reads as an accusation rather than a question.',
      'Approving without reading because the tests pass, which misses design problems tests cannot see.',
    ],
    {
      prompt: 'Review a real diff and write one blocking comment, one suggestion and one nit.',
      steps: ['Read the diff without commenting.', 'Classify each observation.', 'Write the blocking comment with a direction.'],
    },
    [
      'Specific comments with a direction are actionable.',
      'Label blocking versus optional.',
      'Review the design, not only the tests.',
    ],
    [
      q('What makes a review comment useful?', 'It names the problem and suggests a direction', ['It is short', 'It uses strong language', 'It points at the author'], 'The author needs something to act on.'),
      q('Why label comments as blocking or suggestion?', 'The author knows what must change before merge', ['It looks organised', 'GitHub requires it', 'It reduces comments'], 'Otherwise every comment seems mandatory.'),
    ],
  ),

  'github-issues-projects': t(
    'Issues record work and decisions; projects arrange that work into a visible flow. Used together, they replace status meetings with a board anyone can read.',
    ['write an issue with a reproducible description', 'organise work with labels and milestones', 'use a project board with clear columns'],
    [
      ['A good issue', 'State what happened, what was expected and the steps to reproduce. Include the environment and any error output. An issue that cannot be reproduced cannot be fixed, and the reporter is the only person who has the context at that moment.'],
      ['Labels and milestones', 'Labels classify by type and area, such as bug, frontend or needs-design. A milestone groups issues by release or date. Both are filters: if a label does not help someone find or prioritise work, it is noise.'],
    ],
    {
      lang: 'markdown',
      code: `### Steps to reproduce
1. Open /courses/go-programming
2. Click Enrol while signed out
3. Sign in

### Expected
The lesson opens after sign-in.

### Actual
Redirected to the home page.

### Environment
Chrome 131, production, student account`,
      output: 'Anyone can reproduce the bug without asking the reporter',
      explain: 'The three sections are the minimum for a fixable report.',
    },
    [
      'Opening an issue titled "broken" with no steps or environment.',
      'Creating twenty labels that overlap, so nobody knows which to apply.',
    ],
    {
      prompt: 'Write a bug issue with steps, expected and actual, then add one type and one area label.',
      steps: ['Describe the reproduction.', 'State expected and actual.', 'Choose two labels that help triage.'],
    },
    [
      'Reproduction steps are the core of an issue.',
      'Labels and milestones exist to filter.',
      'A board shows flow, not effort.',
    ],
    [
      q('What must a bug report include to be actionable?', 'Steps to reproduce, expected and actual behaviour', ['A screenshot only', 'The author\'s opinion', 'A fix'], 'Without reproduction, the fix is a guess.'),
      q('What is a milestone for?', 'Grouping issues by a release or date', ['Assigning a person', 'Labelling the type', 'Closing duplicates'], 'It answers "when" rather than "what".'),
    ],
  ),

  'github-actions': t(
    'GitHub Actions runs workflows in response to repository events. A workflow that installs, checks and tests on every pull request is the cheapest quality gate a team can add.',
    ['write a workflow with a trigger and jobs', 'cache dependencies', 'keep secrets out of logs'],
    [
      ['Triggers and jobs', 'The on block decides when the workflow runs, such as pull_request or push to main. Each job runs on a fresh runner and contains steps that share a workspace. Steps fail the job on a non-zero exit code, which is how a failing test blocks a merge.'],
      ['Caching and secrets', 'A dependency cache keyed on the lockfile turns a two-minute install into seconds. Secrets are injected as environment variables and masked in logs, but a command that prints them still risks exposure. Never echo a token, and scope permissions to the minimum the job needs.'],
    ],
    {
      lang: 'yaml',
      code: `name: CI
on:
  pull_request:
  push:
    branches: [main]

permissions:
  contents: read

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm test -- --runInBand`,
      output: 'All checks have passed',
      explain: 'A read-only token and a lockfile cache keep the job fast and limited.',
    },
    [
      'Granting write-all permissions to a job that only reads the repository.',
      'Echoing an environment variable that contains a token, which masks only exact matches.',
    ],
    {
      prompt: 'Add a CI workflow that runs lint and tests on every pull request and caches npm.',
      steps: ['Define the trigger.', 'Add setup-node with cache.', 'Run lint and tests.'],
    },
    [
      'Triggers decide when a workflow runs.',
      'Steps fail the job on a non-zero exit code.',
      'Scope permissions and never print secrets.',
    ],
    [
      q('What makes a CI step fail the job?', 'A non-zero exit code', ['Any console output', 'A warning', 'A skipped test'], 'That is how a failing test blocks a merge.'),
      q('Why set permissions: contents: read?', 'The job gets only the access it needs', ['It makes the job faster', 'It enables caching', 'It is required syntax'], 'Least privilege limits damage from a compromised step.'),
    ],
  ),

  'gitignore-and-secrets': t(
    'A secret committed once stays in the repository history. Ignoring the right files before the first commit is far cheaper than removing a leaked key afterwards.',
    ['ignore build output, dependencies and environment files', 'explain why deleting a secret is not enough', 'use a shared ignore template'],
    [
      ['What to ignore', 'Dependencies, build output, logs, editor settings and .env files should never be tracked. A shared .gitignore committed at the root applies to the whole team, and a global ignore handles personal editor files. Run git status before the first commit to confirm nothing unexpected is staged.'],
      ['Deleting is not removing', 'A secret in a commit remains in history and in every clone, even after a later commit deletes the file. Treat it as compromised: rotate the credential first, then consider rewriting history. Rotation is the step that actually protects the system.'],
    ],
    {
      lang: 'bash',
      code: `# .gitignore
node_modules/
dist/
.env
.env.*
!.env.example
coverage/
.DS_Store

# Check before committing
git status --short
git check-ignore -v .env

# If a secret was committed: rotate it first
# then remove it from history with git filter-repo`,
      output: '.env ignored by .gitignore:6',
      explain: 'check-ignore confirms the rule and the line that matched.',
    },
    [
      'Committing .env "just for now" and planning to remove it later.',
      'Assuming a deleted secret is safe because the file is gone from the latest commit.',
    ],
    {
      prompt: 'Add a .gitignore, confirm a secret file is ignored and write the first step to take if one leaks.',
      steps: ['Create the ignore file.', 'Run git check-ignore.', 'Write the rotation step.'],
    },
    [
      'Ignore dependencies, output, logs and environment files.',
      'A committed secret stays in history.',
      'Rotate first, then clean history.',
    ],
    [
      q('Why is deleting a committed secret file not enough?', 'The value remains in history and in every clone', ['Git caches the file', 'The file is read-only', 'It breaks the build'], 'Rotate the credential first, because cleanup alone leaves the secret valid.'),
      q('What is the first step after a secret leaks?', 'Rotate the credential so the old value stops working', ['Rewrite history', 'Delete the repository', 'Add it to .gitignore'], 'Cleanup without rotation leaves the secret valid.'),
    ],
  ),

  'tags-and-releases': t(
    'A tag names a specific commit, usually a release. Semantic versioning tells consumers what changed, and an annotated tag records who released it and when.',
    ['create annotated and lightweight tags', 'apply semantic versioning', 'publish a GitHub release'],
    [
      ['Versions communicate compatibility', 'MAJOR changes break existing use, MINOR adds functionality compatibly, PATCH fixes bugs. A consumer can then decide whether an upgrade is safe without reading the changelog. Starting at 0.x signals that the API may still change.'],
      ['Annotated tags', 'git tag -a v1.4.0 -m "message" stores a tagger, a date and a message, and is the right choice for releases. A lightweight tag is just a pointer. Push tags explicitly, because git push does not send them by default.'],
    ],
    {
      lang: 'bash',
      code: `git tag -a v1.4.0 -m "Add quiz retakes and fix price validation"
git push origin v1.4.0
git tag --list 'v1.*' --sort=-v:refname

# A GitHub release adds notes and assets to the tag
gh release create v1.4.0 --generate-notes`,
      output: 'v1.4.0',
      explain: 'The annotated tag and the release notes tie the version to a summary of the change.',
    },
    [
      'Reusing a version number after publishing it, which makes the version meaningless.',
      'Creating a release from an unmerged branch commit that was never on main.',
    ],
    {
      prompt: 'Tag the current commit as a patch release with a message, push it and list tags in order.',
      steps: ['Choose the next patch version.', 'Create an annotated tag.', 'Push it and verify on the remote.'],
    },
    [
      'Semantic versioning communicates compatibility.',
      'Annotated tags record who and why.',
      'Tags must be pushed explicitly.',
    ],
    [
      q('When should the major version increase?', 'When the change breaks existing consumers', ['For every new feature', 'For bug fixes', 'For documentation'], 'That is what the major number signals.'),
      q('Why use an annotated tag for a release?', 'It stores the tagger, date and message with the tag', ['It is faster', 'It is required by Git', 'It signs the commit'], 'A lightweight tag is only a pointer.'),
    ],
  ),

  recovery: t(
    'Git rarely loses committed work. The reflog records where branches and HEAD have been, and bisect finds the commit that introduced a bug.',
    ['recover a lost commit with the reflog', 'find a regression with bisect', 'avoid destructive commands on shared branches'],
    [
      ['The reflog', 'Every move of HEAD and every branch update is recorded locally for a few weeks. If a reset or rebase discarded commits, git reflog shows the previous position and git reset --hard <hash> restores it. The reflog is local, so it cannot recover work that only existed on another machine.'],
      ['Bisect', 'git bisect start, then mark a known good and a known bad commit. Git checks out the midpoint and asks you to classify it, halving the range each time. A regression in a thousand commits is found in about ten steps, and git bisect run automates it with a test command.'],
    ],
    {
      lang: 'bash',
      code: `git reflog
# 9a7c2f1 HEAD@{2}: reset: moving to HEAD~2
git reset --hard HEAD@{2}

git bisect start
git bisect bad
git bisect good v1.3.0
# test each checkout, then:
git bisect good   # or bad
git bisect reset

# automated:
git bisect run npm test`,
      output: '4f2c1a9 is the first bad commit',
      explain: 'Bisect narrows the range logarithmically instead of reading every diff.',
    },
    [
      'Panicking after a reset and cloning the repository again, which discards the reflog that could recover the work.',
      'Marking a commit good or bad without running the reproduction, which produces a wrong result.',
    ],
    {
      prompt: 'Use the reflog to restore a commit discarded by a local reset.',
      steps: ['Run git reflog.', 'Find the position before the reset.', 'Reset --hard to that hash.'],
    },
    [
      'The reflog recovers local commits and is local only.',
      'Bisect finds a regression in logarithmic steps.',
      'Verify each bisect step with the reproduction.',
    ],
    [
      q('What does the reflog record?', 'Local movements of HEAD and branch pointers', ['Remote pushes', 'File contents', 'Commit messages only'], 'It is how discarded local commits are recovered.'),
      q('How many steps does bisect need for 1,000 commits?', 'About ten, because it halves the range each time', ['One thousand', 'One hundred', 'Two'], 'Logarithmic search is the point.'),
    ],
  ),

  capstone: t(
    'The capstone is a complete team workflow: an issue, a short branch, atomic commits, a reviewed pull request, passing CI and a tagged release.',
    ['run a change through the full team workflow', 'produce a reviewable pull request', 'release and verify the result'],
    [
      ['The workflow is the deliverable', 'Open an issue, branch from an up-to-date main, commit in small steps, push with an upstream, open a pull request that links the issue, address review, merge and tag. Each step leaves a record that someone else can follow, which is what makes the history useful.'],
      ['Verify before and after', 'Run the tests locally before pushing, confirm CI passes on the pull request, and check the deployed result after merge. A green check proves the pipeline ran, not that the feature works, so the manual check is still part of the release.'],
    ],
    {
      lang: 'bash',
      code: `gh issue create --title "Reject negative course price" --body "..."
git switch -c fix/negative-price
git add -p
git commit -m "Reject a negative price on course create"
git push -u origin fix/negative-price
gh pr create --fill --body "Closes #482"

# after review and green CI
gh pr merge --squash --delete-branch
git switch main && git pull --ff-only
git tag -a v1.4.1 -m "Fix negative course price"
git push origin v1.4.1`,
      output: 'Merged #483 and released v1.4.1',
      explain: 'Every step is recorded, so the release can be traced back to an issue and a review.',
    },
    [
      'Skipping the issue and the description, so the change has no recorded reason.',
      'Merging with failing checks because "it works locally".',
    ],
    {
      prompt: 'Take one real change through issue, branch, commits, pull request, review, merge and tag.',
      steps: ['Open the issue.', 'Keep the branch short.', 'Link, review, merge and tag the release.'],
    },
    [
      'The workflow leaves the record that makes history useful.',
      'CI proves the pipeline ran; verify the feature too.',
      'A release is a tag plus a summary.',
    ],
    [
      q('Why link a pull request to an issue?', 'The reason and the discussion stay connected to the change', ['It merges faster', 'It closes the branch', 'It runs CI'], 'Future readers can find the why.'),
      q('What does a green CI check prove?', 'That the configured checks passed, not that the feature works correctly', ['That the feature is correct', 'That the code is reviewed', 'That the release is tagged'], 'Manual verification is still required.'),
    ],
  ),
};

module.exports = {
  slug: 'git-github-teams',
  title: 'Git & GitHub for Teams',
  shortDescription:
    'Use Git confidently in a team: reviewable commits, clean branches, pull requests, CI and safe recovery.',
  description:
    'A practical Git and GitHub course for developers who already write code and now need to collaborate. You will learn what a commit really contains, how to write history people can review, how branching, merging and rebasing differ, how to resolve conflicts without fear, how pull requests and code review work, how to organise work with issues and projects, how to add a CI workflow, and how to recover lost work and remove a leaked secret. Each module ends with a ten-question quiz, and the capstone runs a change through the full team workflow.',
  level: 'Beginner',
  price: 49.99,
  duration: '6 weeks',
  featured: false,
  outcomes: [
    'Explain snapshots, the index and the commit graph',
    'Write atomic commits with useful messages',
    'Branch, merge and rebase without rewriting shared history',
    'Resolve merge conflicts deliberately',
    'Run pull requests and code review that get read',
    'Organise work with issues, labels and projects',
    'Add a CI workflow with caching and least privilege',
    'Recover lost commits and respond to a leaked secret',
  ],
  requirements: [
    'Comfort using a terminal',
    'A GitHub account',
    'Some experience writing code in any language',
  ],
  targetAudience:
    'Developers joining a team, and solo developers who want a workflow that scales beyond one person.',
  modules: [
    {
      title: 'Module 1: The Git model',
      description: 'Understand snapshots, commits and history before branching.',
      check: [
        q('A commit contains a fix and a whole-file reformat. Why is that a problem?',
          'Reverting the fix also reverts the formatting, so the commit is not atomic',
          ['Git cannot store formatting', 'The commit is too large', 'It breaks the branch'],
          'One commit should contain one coherent change.'),
        q('A secret was committed and then deleted in a later commit. What is the first step?',
          'Rotate the credential, because it remains in history',
          ['Rewrite history immediately', 'Delete the repository', 'Add it to .gitignore'],
          'Rotation is what actually stops the leaked value working.'),
      ],
      lessons: [
        { title: 'Why version control', objective: 'Understand snapshots, the index and local history.', topic: 'why-version-control', minutes: 25 },
        { title: 'Commits people can review', objective: 'Stage precisely and explain the why.', topic: 'commits', minutes: 30 },
        { title: 'Reading history', objective: 'Answer when, who and why with log and blame.', topic: 'history', minutes: 25 },
        { title: 'Undoing safely', objective: 'Choose between restore, revert and reset.', topic: 'undoing', minutes: 30 },
      ],
    },
    {
      title: 'Module 2: Branching and integration',
      description: 'Isolate work, merge it and choose when rewriting history is acceptable.',
      check: [
        q('Why is rebasing a branch that others have pulled from dangerous?',
          'It rewrites commit hashes, so their history diverges',
          ['It deletes their commits', 'It requires a merge commit', 'It removes the remote'],
          'Only rewrite commits that have not been shared.'),
        q('What does a merge commit record that a fast-forward does not?',
          'A commit with two parents, preserving the branch boundary in history',
          ['A copy of the files', 'A new remote', 'A tag'],
          'The two-parent commit is how the graph shows that a feature was integrated.'),
      ],
      lessons: [
        { title: 'Branches and merges', objective: 'Isolate work and combine it deliberately.', topic: 'branches', minutes: 30 },
        { title: 'Resolving conflicts', objective: 'Read both intents and write the combined result.', topic: 'merge-conflicts', minutes: 30 },
        { title: 'Rebase and squash', objective: 'Clean up unpublished history safely.', topic: 'rebase', minutes: 30 },
        { title: 'Remotes and tracking', objective: 'Fetch, integrate and push with confidence.', topic: 'remote-basics', minutes: 30 },
      ],
    },
    {
      title: 'Module 3: Working with a team',
      description: 'Propose changes, review them well and make the work visible.',
      check: [
        q('Why do large pull requests get superficial reviews?',
          'Reviewers cannot hold the whole change in mind, so they skim',
          ['GitHub limits their size', 'They cannot be merged', 'They run slower CI'],
          'Small, focused PRs get line-by-line attention.'),
        q('What makes a review comment actionable?',
          'It names the problem and suggests a direction',
          ['It is short', 'It uses strong language', 'It points at the author'],
          'The author needs something they can change.'),
      ],
      lessons: [
        { title: 'Pull requests that get reviewed', objective: 'Supply context and keep the diff small.', topic: 'pull-requests', minutes: 30 },
        { title: 'Code review', objective: 'Give specific, prioritised feedback.', topic: 'code-review', minutes: 30 },
        { title: 'Issues, labels and projects', objective: 'Make work visible and filterable.', topic: 'github-issues-projects', minutes: 25 },
        { title: 'CI with GitHub Actions', objective: 'Run checks on every pull request.', topic: 'github-actions', minutes: 35 },
      ],
    },
    {
      title: 'Module 4: Safety and releases',
      description: 'Protect secrets, version releases and recover when something goes wrong.',
      check: [
        q('Which tag type records who released and when?',
          'An annotated tag',
          ['A lightweight tag', 'A branch', 'A remote'],
          'It stores a tagger, date and message.'),
        q('A regression appeared somewhere in the last 1,000 commits. How do you find it?',
          'Use git bisect to halve the range until the first bad commit',
          ['Read every diff', 'Reset to the oldest commit', 'Delete the branch'],
          'Bisect needs about ten steps for 1,000 commits.'),
      ],
      lessons: [
        { title: 'Ignoring files and secrets', objective: 'Keep credentials out of history.', topic: 'gitignore-and-secrets', minutes: 25 },
        { title: 'Tags and releases', objective: 'Version releases so consumers know what changed.', topic: 'tags-and-releases', minutes: 25 },
        { title: 'Recovery with reflog and bisect', objective: 'Restore lost work and locate a regression.', topic: 'recovery', minutes: 30 },
        { title: 'Capstone: the full team workflow', objective: 'Run one change from issue to release.', topic: 'capstone', minutes: 45 },
      ],
    },
  ],
  topics,
};
