<!-- Quick Navigation for dist_test Copilot Session -->
# 🚀 Copilot Test Session - Navigate Here

## 📍 You Are Here
```
llm-memory/
└── dist_test/  ← Isolated test environment
```

---

## 🎯 STEP 1: Open Context
```
File: .vscode/copilot-context.md
Action: Open in editor / Copy all content
```

**What you'll see:**
- 3 Architectural Policies
- Each with description + JSON rules
- Latency metrics

---

## 💬 STEP 2: Open Copilot Chat
```
VS Code: Ctrl+Shift+I
Paste: Content from .vscode/copilot-context.md
```

---

## 📋 STEP 3: Pick a Prompt
See: `docs/COPILOT_QUICK_REF.md`

**Quick Examples:**
1. "Create an AuthService class"
2. "Add async error handling"
3. "Add structured logging"

---

## ✅ STEP 4: Verify Output
Check if generated code has:
- ✓ Correct naming (e.g., `AuthService` not `auth_service`)
- ✓ Error handling (30s timeout, 3x retry)
- ✓ JSON logging structure

---

## 📚 Reference Files

| File | Purpose | Read Time |
|------|---------|-----------|
| `COPILOT_START_HERE.md` | Overview | 2 min |
| `docs/COPILOT_QUICK_REF.md` | Example prompts | 3 min |
| `docs/COPILOT_TESTING.md` | Full guide | 10 min |
| `COPILOT_TEST_SUMMARY.md` | System status | 5 min |

---

## 🔗 Quick Links

- **Policies**: `.vscode/copilot-context.md`
- **Generator Script**: `scripts/test-copilot-context.ps1`
- **Examples**: `docs/COPILOT_QUICK_REF.md`
- **Full Docs**: `docs/COPILOT_TESTING.md`

---

## ⚠️ If Something Goes Wrong

1. **Context file empty?**
   - Run: `scripts/test-copilot-context.ps1` (from parent dir)
   - Ensure Agent is running on localhost:3000

2. **Copilot not using context?**
   - Make sure you pasted the `.vscode/copilot-context.md` content
   - Try: "Based on the policies I just pasted: ..."

3. **Code doesn't follow policies?**
   - Refresh context and try again
   - Be more specific in prompt

---

**Next:** Open `.vscode/copilot-context.md` and copy to Copilot Chat!

