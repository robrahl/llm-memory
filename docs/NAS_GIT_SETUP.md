# NAS Git Repository Setup

## SSH-Befehl für NAS

Führe diesen Befehl in einer SSH-Session aus:

```bash
ssh robertorahl@rahlnas3

# Dann auf der NAS:
cd /volume1/git
git init --bare llm-memory.git
ls -la llm-memory.git
```

## Nach Repository-Erstellung

Dann auf deinem lokalen PC:

```powershell
cd C:\Z_D-LW\GIT_REPOS\llm-memory

# Remote hinzufügen
git remote add nas ssh://robertorahl@rahlnas3:/volume1/git/llm-memory.git

# Verifizieren
git remote -v

# Push zu NAS
git push -u nas main
```

## Schnell-Anleitung

1. SSH zu NAS: `ssh robertorahl@rahlnas3`
2. Bare Repo erstellen: `git init --bare /volume1/git/llm-memory.git`
3. Zurück zu local: `exit`
4. Remote hinzufügen: `git remote add nas ssh://robertorahl@rahlnas3:/volume1/git/llm-memory.git`
5. Push: `git push -u nas main`

