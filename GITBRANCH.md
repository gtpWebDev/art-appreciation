# Github development on new branch

1. Start by making sure you are on the main branch, and have the latest changes.

```bash
git pull origin main
```

2. Create a new branch where you'll work on your feature or bugfix. You can name your branch something descriptive like feature/add-login or bugfix/fix-auth-issue:

```bash
git checkout -b amend/merge-purchase-and-listing
```

(This creates a new branch and switches to that branch)

3. Work on the changes
   Now, you can make changes to your project. Use the usal methods - status, add, commit

```bash
git status
git add .
git commit -m "text"
```

4. Push the Branch to GitHub

```bash
git push origin amend/merge-purchase-and-listing
```

5. Create a Pull Request (PR) on GitHub
   Go to the GitHub website, navigate to the repository, and you'll see a notification that a new branch has been pushed. There will be a prompt to create a "New Pull Request." Click that button.

Select the branch you want to merge into (typically main) and the branch you are working on (amend/merge-purchase-and-listing).
Add a description of your changes.
Submit the pull request.

6. Review and Approve the PR
   If you’re working in a team, this is where the team reviews the pull request and provides feedback. If you’re working alone, you can still review the changes on GitHub to ensure everything is correct.

Once the pull request is approved (if needed), you can proceed to merge it.

7. Merge the Pull Request
   You can merge the pull request on GitHub via the interface:
   There will be a "Merge pull request" button at the bottom of the PR page.
   Click it and choose "Confirm Merge."
   Once the PR is merged, GitHub will give you the option to delete the feature branch. It's a good idea to delete it to keep the branch structure clean unless you have a reason to keep it.

8. Sync Your Local Main Branch
   After merging the branch, go back to your local machine. Switch back to the main branch and pull the latest changes:

```bash
git checkout main
git pull origin main
```

This ensures your local main branch is up to date with the latest changes from GitHub.

9. Clean Up (Optional)
   If you no longer need the feature branch locally, you can delete it:

```bash
git branch -d amend/merge-purchase-and-listing
```

If the branch was already merged, it will delete the branch safely. If not, you’ll get a warning.
