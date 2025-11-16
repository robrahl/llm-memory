# Archive - Alte Dokumentation

Veraltete Dateien und Test-Dokumentation, die nicht mehr aktiv verwendet werden.

## 📋 Inhalt

| Datei | Grund für Archivierung |
|-------|----------------------|
| `COPILOT_START_HERE.md` | Moved to dist_test/ für Test-Sessions |
| `COPILOT_TEST_SUMMARY.md` | Ist in dist_test/ verfügbar |
| `COPILOT_TESTING.md` | Moved to dist_test/ |
| `COPILOT_TEST_SUMMARY.md` | Test-Dokumentation |

## 🔄 Warum archiviert?

- Copilot-Test-Setup ist jetzt **isoliert in `dist_test/`**
- Hauptebene konzentriert sich auf **aktive Entwicklung**
- Dokumentation bleibt verfügbar, aber nicht im Root-Level

## 📚 Aktive Dokumentation (im Root):

- `README.md` — Projekt-Übersicht
- `pdr.md` — Design Review
- `architecture.md` — Architektur
- `docs/NAS_DEPLOYMENT.md` — Deployment-Guide
- `docs/COPILOT_INTEGRATION.md` — MCP Integration (V1 Roadmap)

## 🔄 Wenn nötig:

```bash
# Wiederherstellen aus Archive:
mv archive/COPILOT_TESTING.md docs/
```

