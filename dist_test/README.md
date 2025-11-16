# dist_test - Isolated Copilot Test Environment

Eigenständiges Test-Setup für Copilot-Integration mit llm-memory Policies.

## 📋 Inhaltsverzeichnis

```
dist_test/
├── .vscode/
│   ├── copilot-context.md        (Auto-generated policies)
│   └── settings.json              (VS Code config)
├── scripts/
│   └── test-copilot-context.ps1  (Context generator)
├── docs/
│   ├── COPILOT_QUICK_REF.md      (5 Example prompts)
│   ├── COPILOT_TESTING.md        (Full guide)
│   ├── COPILOT_INTEGRATION.md    (Architecture)
├── COPILOT_START_HERE.md         (Quick start)
├── COPILOT_TEST_SUMMARY.md       (System status)
└── README.md                      (This file)
```

## ⚡ Quick Start

### 1. Context File öffnen
```powershell
# Öffne die generierte Kontext-Datei
code .vscode\copilot-context.md
```

### 2. In Copilot Chat kopieren
```
1. Öffne VS Code
2. Öffne Copilot Chat (Ctrl+Shift+I)
3. Kopiere Inhalt von .vscode/copilot-context.md
4. Paste in Copilot Chat
```

### 3. Test-Prompt nutzen
Nutze einen der Prompts aus `docs/COPILOT_QUICK_REF.md`:

```
Based on .vscode/copilot-context.md:
Create an AuthService class that:
1. Follows the naming convention
2. Has proper error handling with timeouts
3. Uses structured JSON logging
```

## 📚 Policies im Test

| Policy | Beschreibung |
|--------|-------------|
| `naming_convention` | Services: `{SomethingService}` |
| `error_handling` | Async: 30s timeout, 3x retry |
| `logging_level` | JSON structured logs |

## 🚀 Test-Szenarien

### Szenario 1: Service erstellen
```
Prompt: "Generate a PaymentService class"
Ergebnis: Copilot erstellt Service mit korrektem Namen
✓ naming_convention befolgt
```

### Szenario 2: Error Handling
```
Prompt: "Add async database call with proper error handling"
Ergebnis: try/catch mit 30s timeout + 3x retry
✓ error_handling befolgt
```

### Szenario 3: Logging
```
Prompt: "Add structured logging to the class"
Ergebnis: JSON logs mit debug/info/warn/error levels
✓ logging_level befolgt
```

## 📝 Dateien

| Datei | Zweck |
|-------|-------|
| `.vscode/copilot-context.md` | Generierte Policies für Copilot |
| `scripts/test-copilot-context.ps1` | Fetcht Policies vom Agent |
| `docs/COPILOT_QUICK_REF.md` | Copy-paste Beispiel-Prompts |
| `docs/COPILOT_TESTING.md` | Vollständige Test-Anleitung |
| `COPILOT_START_HERE.md` | Schnell-Einstieg |

## ✅ Checklist

- [ ] `.vscode/copilot-context.md` geöffnet
- [ ] Inhalt in Copilot Chat kopiert
- [ ] Erstes Beispiel aus `COPILOT_QUICK_REF.md` getestet
- [ ] Code-Output gegen Policies validiert
- [ ] Alle 3 Policies in generiertem Code erkannt

## 🔄 Kontext aktualisieren

Wenn sich Policies ändern:

```powershell
# Aus dem Haupt-Ordner:
.\scripts\test-copilot-context.ps1

# Oder im dist_test Ordner:
.\scripts\test-copilot-context.ps1 -AgentHost localhost -AgentPort 3000
```

Dann neuen Inhalt in Copilot Chat neu einfügen.

## 📖 Nächste Schritte

1. **START HERE** lesen: `COPILOT_START_HERE.md`
2. **Quick Ref** prüfen: `docs/COPILOT_QUICK_REF.md`
3. **Test** durchführen: Prompt in Copilot Chat
4. **Validieren**: Code befolgt alle 3 Policies

---

**Status:** Ready for isolated Copilot testing! 🎉

