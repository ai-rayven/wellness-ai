#!/usr/bin/env bash
# Posts the phone screenshots in frontend/screens to a PR, as one comment that each run updates.
# GitHub has no API to attach images to a comment, so the images go to the ci-screens branch
# and the comment links them. Runs in CI, with GH_TOKEN and GITHUB_REPOSITORY set.
set -euo pipefail
cd "$(dirname "$0")/.."

pr="${1:?Usage: post-screens.sh <PR number> <commit>}"
commit="${2:?Usage: post-screens.sh <PR number> <commit>}"
repo="${GITHUB_REPOSITORY:?GITHUB_REPOSITORY is not set}"
src="$PWD/frontend/screens"
shopt -s nullglob
images=("$src"/*.png)
[ ${#images[@]} -gt 0 ] || { echo "No screenshots in $src" >&2; exit 1; }

# Put this PR's images in pr-<n>/ on the ci-screens branch. Other PRs use other folders.
work="$(mktemp -d)"
if git fetch --depth 1 origin ci-screens; then
  git worktree add --detach "$work" FETCH_HEAD
else
  git worktree add --orphan -b ci-screens "$work"
fi
rm -rf "$work/pr-$pr"
mkdir -p "$work/pr-$pr"
cp "${images[@]}" "$work/pr-$pr/"
git -C "$work" add -A
git -C "$work" -c user.name='github-actions[bot]' -c user.email='github-actions[bot]@users.noreply.github.com' \
  commit -qm "Screenshots of PR #$pr at $commit"
# Another PR can push between the fetch and the push. Its folder is different, so a rebase is safe.
for attempt in 1 2 3; do
  git -C "$work" push -q origin HEAD:refs/heads/ci-screens && break
  [ "$attempt" -lt 3 ] || exit 1
  git -C "$work" fetch -q --depth 1 origin ci-screens
  git -C "$work" rebase -q FETCH_HEAD
done
sha="$(git -C "$work" rev-parse HEAD)"

marker='<!-- screens -->'
cells=""
for image in "${images[@]}"; do
  name="$(basename "$image" .png)"
  cells+="<td align=\"center\"><img src=\"https://raw.githubusercontent.com/$repo/$sha/pr-$pr/$name.png\" width=\"200\"><br>${name#*-}</td>"
done
body="$marker
### Phone screenshots
At $commit, on an iPhone 13 screen.

<table><tr>$cells</tr></table>"

comment="$(gh api "repos/$repo/issues/$pr/comments" --paginate \
  --jq ".[] | select(.body | startswith(\"$marker\")) | .id" | head -n 1)"
if [ -n "$comment" ]; then
  gh api -X PATCH "repos/$repo/issues/comments/$comment" -f body="$body" > /dev/null
else
  gh api "repos/$repo/issues/$pr/comments" -f body="$body" > /dev/null
fi
