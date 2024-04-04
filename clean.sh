#! usr/bin/bash
cd packages/contracts 
rm -rf types 
git ls-files types | xargs -I {} git update-index --skip-worktree {}