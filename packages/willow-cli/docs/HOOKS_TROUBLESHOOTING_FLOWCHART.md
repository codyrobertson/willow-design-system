# Pre-commit Hooks Troubleshooting Flowchart 🔍

## Start Here ⬇️

```
┌─────────────────────────────────┐
│   Hooks not working properly?   │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│  Run: npm run hooks:verify      │
└────────────┬────────────────────┘
             │
        ┌────┴────┐
        │ Passed? │
        └────┬────┘
    No ◀─────┴─────▶ Yes
    │                 │
    ▼                 ▼
┌──────────────┐  ┌─────────────────────┐
│ Check Below  │  │ Still have issues?  │
│   Sections   │  └──────────┬──────────┘
└──────────────┘             │
                        No ◀─┴─▶ Yes
                        │        │
                        ▼        ▼
                   ┌────────┐  Check
                   │  Done  │  Specific
                   └────────┘  Issues
```

## Hooks Not Running At All

```
┌─────────────────────────────────┐
│    Commits without checks?      │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│  Check: echo $HUSKY             │
└────────────┬────────────────────┘
             │
     Shows "0"? ──── Yes ──→ Run: unset HUSKY
         │
         No
         │
         ▼
┌─────────────────────────────────┐
│  Run: ls -la .husky/            │
└────────────┬────────────────────┘
             │
   Files missing? ── Yes ──→ Run: npm run hooks:install
         │
         No
         │
         ▼
┌─────────────────────────────────┐
│  Run: git --version             │
└────────────┬────────────────────┘
             │
    < 2.20? ──── Yes ──→ Update Git
         │
         No
         │
         ▼
┌─────────────────────────────────┐
│  Run: chmod +x .husky/*         │
└─────────────────────────────────┘
```

## ESLint Errors

```
┌─────────────────────────────────┐
│      ESLint errors?             │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│  Run: npm run lint:fix          │
└────────────┬────────────────────┘
             │
     Fixed? ──── Yes ──→ Try commit again
         │
         No
         │
         ▼
┌─────────────────────────────────┐
│  Run: npm run lint              │
│  (See specific errors)          │
└────────────┬────────────────────┘
             │
             ▼
    ┌────────┴────────┐
    │ Error Type?     │
    └────────┬────────┘
             │
    ┌────────┼────────┬──────────┬───────────┐
    │        │        │          │           │
    ▼        ▼        ▼          ▼           ▼
 Unused   Missing  Console   Naming    Max warnings
 imports  semicolon  logs    errors    exceeded
    │        │        │          │           │
    ▼        ▼        ▼          ▼           ▼
 Remove   Add ;   Remove    Fix names  Fix other
                  console.              errors first
```

## TypeScript Errors

```
┌─────────────────────────────────┐
│    TypeScript failed?           │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│  Run: npm run type-check        │
└────────────┬────────────────────┘
             │
             ▼
    ┌────────┴────────┐
    │ Error Type?     │
    └────────┬────────┘
             │
    ┌────────┼────────┬──────────┐
    │        │        │          │
    ▼        ▼        ▼          ▼
 Cannot    Type     Property   Import
  find    errors   missing    errors
    │        │        │          │
    ▼        ▼        ▼          ▼
 Check    Add      Add ?:     Fix
 imports  types    optional   paths
```

## Commit Message Errors

```
┌─────────────────────────────────┐
│  Invalid commit message?        │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│  Check format:                  │
│  type(scope): description       │
└────────────┬────────────────────┘
             │
             ▼
    ┌────────┴────────┐
    │ What's wrong?   │
    └────────┬────────┘
             │
    ┌────────┼────────┬──────────┐
    │        │        │          │
    ▼        ▼        ▼          ▼
 No type  Missing  Wrong     Capital
          colon    case      after :
    │        │        │          │
    ▼        ▼        ▼          ▼
 Add:     Add :   Use       Use
 feat,            lowercase  lowercase
 fix, etc.
```

## Performance Issues

```
┌─────────────────────────────────┐
│      Hooks too slow?           │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│  Run: npm run hooks:benchmark  │
└────────────┬────────────────────┘
             │
      > 10s? ──── No ──→ Acceptable
         │
        Yes
         │
         ▼
┌─────────────────────────────────┐
│  Clear caches:                  │
│  rm -rf node_modules/.cache     │
└────────────┬────────────────────┘
             │
    Still slow? ── No ──→ Fixed
         │
        Yes
         │
         ▼
┌─────────────────────────────────┐
│  Commit smaller chunks:         │
│  git add -p (interactive)       │
└─────────────────────────────────┘
```

## Emergency Bypass Flow

```
┌─────────────────────────────────┐
│   URGENT: Must commit now?      │
└────────────┬────────────────────┘
             │
             ▼
    ┌────────┴────────┐
    │  True emergency? │
    └────────┬────────┘
    No ◀─────┴─────▶ Yes
    │                 │
    ▼                 ▼
┌──────────────┐  ┌─────────────────────┐
│ Fix issues   │  │ git commit --no-    │
│    first     │  │ verify -m "hotfix:  │
└──────────────┘  │ critical issue"     │
                  └──────────┬──────────┘
                             │
                             ▼
                  ┌─────────────────────┐
                  │ Document why in     │
                  │ commit message      │
                  └─────────────────────┘
```

## Still Stuck?

```
┌─────────────────────────────────┐
│     Tried everything?           │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│  1. Read full troubleshooting   │
│     guide: HOOKS_TROUBLE        │
│     SHOOTING.md                 │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│  2. Search GitHub issues        │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│  3. Ask in #dev-help Slack      │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│  4. Create issue with:          │
│     - npm run hooks:verify      │
│     - Error messages            │
│     - Node/OS versions          │
└─────────────────────────────────┘
```

---

*💡 Tip: Most issues are solved by running `npm run hooks:verify` and following its suggestions!*