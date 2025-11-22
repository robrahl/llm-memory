# Git Repository Setup on Synology NAS

Configure your Synology NAS as a Git remote for automated backups and version control.

## Why Use NAS as Git Remote?

- **Automatic Backup**: Every push saves to your local NAS
- **Fast Transfers**: Local network speed
- **Offline Access**: No internet required
- **Privacy**: Your code stays on your hardware
- **Redundancy**: Keep GitHub and NAS copies

## Prerequisites

- SSH access to your Synology NAS
- Git installed on your local machine
- Basic Git knowledge

## Setup Steps

### 1. Create Bare Repository on NAS

SSH into your NAS:

```bash
ssh your_username@your_nas_hostname
# Example: ssh robertorahl@rahlnas3
```

Create a bare Git repository:

```bash
# Create git directory if it doesn't exist
mkdir -p /volume1/git

# Create bare repository
cd /volume1/git
git init --bare llm-memory.git

# Verify creation
ls -la llm-memory.git
```

Expected output shows Git repository structure:
```
branches/
config
description
HEAD
hooks/
info/
objects/
refs/
```

Exit SSH session:
```bash
exit
```

### 2. Add NAS Remote to Local Repository

On your local machine, navigate to your llm-memory repository:

```bash
cd /path/to/llm-memory
```

Add the NAS as a Git remote:

```bash
# Add remote named 'nas'
git remote add nas ssh://your_username@your_nas_hostname:/volume1/git/llm-memory.git

# Example:
git remote add nas ssh://robertorahl@rahlnas3:/volume1/git/llm-memory.git

# Verify remotes
git remote -v
```

You should see:
```
origin  https://github.com/robrahl/llm-memory.git (fetch)
origin  https://github.com/robrahl/llm-memory.git (push)
nas     ssh://robertorahl@rahlnas3:/volume1/git/llm-memory.git (fetch)
nas     ssh://robertorahl@rahlnas3:/volume1/git/llm-memory.git (push)
```

### 3. Push to NAS

```bash
# First push (creates main branch on NAS)
git push -u nas main

# Future pushes
git push nas main
```

### 4. Configure Parallel Push (Optional)

To push to both GitHub and NAS with a single command:

```bash
# Add NAS as additional push URL to origin
git remote set-url --add --push origin ssh://your_username@your_nas_hostname:/volume1/git/llm-memory.git
git remote set-url --add --push origin https://github.com/robrahl/llm-memory.git

# Verify
git remote -v
```

Now `git push origin main` pushes to both remotes simultaneously.

## Usage

### Push to Both Remotes

```bash
# Parallel push (if configured)
git push origin main

# Or push individually
git push github main  # to GitHub only
git push nas main     # to NAS only
```

### Push All Branches and Tags

```bash
# To NAS
git push nas --all --tags

# To both (if parallel configured)
git push origin --all --tags
```

### Clone from NAS

From another machine on your network:

```bash
git clone ssh://your_username@your_nas_hostname:/volume1/git/llm-memory.git
```

## Troubleshooting

### SSH Authentication Failed

**Symptom:** `Permission denied (publickey,password)`

**Solution 1: Use SSH key (recommended)**

```bash
# Generate SSH key (if you don't have one)
ssh-keygen -t ed25519 -C "your_email@example.com"

# Copy public key to NAS
ssh-copy-id your_username@your_nas_hostname

# Test connection
ssh your_username@your_nas_hostname
```

**Solution 2: Use password**

Git will prompt for password on each push. Consider using SSH keys for convenience.

### Host Key Verification Failed

**Symptom:** `Host key verification failed`

**Solution:**

```bash
# Remove old host key
ssh-keygen -R your_nas_hostname

# Connect again to accept new key
ssh your_username@your_nas_hostname
```

### Repository Not Found

**Symptom:** `fatal: repository not found`

**Check:**

1. **Path is correct:**
   ```bash
   ssh your_username@your_nas_hostname "ls -la /volume1/git/llm-memory.git"
   ```

2. **Permissions:**
   ```bash
   ssh your_username@your_nas_hostname "chmod -R 755 /volume1/git/llm-memory.git"
   ```

### Push Rejected

**Symptom:** `! [rejected] main -> main (non-fast-forward)`

**Solution:**

```bash
# Fetch first
git fetch nas

# Merge or rebase
git merge nas/main
# or
git rebase nas/main

# Then push
git push nas main
```

## Backup and Recovery

### Backup NAS Repository

```bash
# On NAS
cd /volume1/git
tar -czf llm-memory-backup-$(date +%Y%m%d).tar.gz llm-memory.git

# Or copy to another location
cp -r llm-memory.git /volume1/backup/git/
```

### Restore from NAS

```bash
# Clone from NAS
git clone ssh://your_username@your_nas_hostname:/volume1/git/llm-memory.git

# All history and branches are restored
```

### Verify Repository Integrity

```bash
# On NAS
cd /volume1/git/llm-memory.git
git fsck --full
```

## Advanced Configuration

### Custom SSH Port

If your NAS uses a non-standard SSH port:

```bash
# Add remote with custom port
git remote add nas ssh://your_username@your_nas_hostname:2222/volume1/git/llm-memory.git
```

### SSH Config

Create `~/.ssh/config` for easier access:

```bash
Host nas
    HostName your_nas_hostname
    User your_username
    Port 22
    IdentityFile ~/.ssh/id_ed25519
```

Then use simplified commands:

```bash
git remote add nas ssh://nas:/volume1/git/llm-memory.git
git push nas main
```

### Automatic Backups

Create a Git hook for automatic NAS backup on push:

```bash
# In your local repo
cat > .git/hooks/post-commit << 'HOOK'
#!/bin/bash
git push nas main &
HOOK

chmod +x .git/hooks/post-commit
```

## Security Considerations

1. **Use SSH keys** instead of passwords
2. **Limit SSH access** to specific users
3. **Enable firewall** on NAS for SSH port
4. **Regular backups** of the NAS git directory
5. **Monitor access logs** on NAS

## Multiple Repositories

To set up more repositories on your NAS:

```bash
# On NAS
cd /volume1/git
git init --bare another-project.git

# On local machine
cd /path/to/another-project
git remote add nas ssh://your_username@your_nas_hostname:/volume1/git/another-project.git
git push -u nas main
```

## Next Steps

- [Return to NAS Deployment Guide](README.md)
- [Configure Automated Backups](../backup.md)
- [Learn about Copilot Integration](../../copilot/README.md)
