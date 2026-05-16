#!/usr/bin/env pwsh

# Colors
$Red = "`e[31m"
$Green = "`e[32m"
$Yellow = "`e[33m"
$Blue = "`e[34m"
$Reset = "`e[0m"

Write-Host "${Blue}🚀 GitHub Push Command${Reset}"
Write-Host "=================================="
Write-Host ""

# Check if we're in a git repository
try {
    $null = git rev-parse --git-dir
}
catch {
    Write-Host "${Red}❌ Not in a git repository${Reset}"
    exit 1
}

# Get current branch
$CurrentBranch = git rev-parse --abbrev-ref HEAD
Write-Host "${Blue}📍 Current branch: ${Green}$CurrentBranch${Reset}"
Write-Host ""

# Show git status
Write-Host "${Blue}📊 Git Status:${Reset}"
git status --short
Write-Host ""

# Show last 3 commits
Write-Host "${Blue}📜 Last 3 commits:${Reset}"
git log --oneline -3
Write-Host ""

# Check for uncommitted changes
$DiffOutput = git diff-index --quiet HEAD -- 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "${Yellow}⚠️  You have uncommitted changes. Would you like to commit them? (y/n)${Reset}" -NoNewline
    $CommitChoice = Read-Host
    if ($CommitChoice -eq "y" -or $CommitChoice -eq "Y") {
        Write-Host "${Blue}📝 Enter commit message:${Reset}" -NoNewline
        $CommitMsg = Read-Host
        if ([string]::IsNullOrWhiteSpace($CommitMsg)) {
            Write-Host "${Red}❌ Commit message cannot be empty${Reset}"
            exit 1
        }
        git add .
        git commit -m "$CommitMsg"
        Write-Host "${Green}✅ Changes committed${Reset}"
    }
}

# Check for untracked files
$Untracked = git ls-files --others --exclude-standard
if ($Untracked) {
    Write-Host "${Yellow}⚠️  You have untracked files:${Reset}"
    Write-Host $Untracked
    Write-Host "${Yellow}Would you like to add them? (y/n)${Reset}" -NoNewline
    $AddChoice = Read-Host
    if ($AddChoice -eq "y" -or $AddChoice -eq "Y") {
        git add .
        Write-Host "${Blue}📝 Enter commit message for untracked files:${Reset}" -NoNewline
        $CommitMsg = Read-Host
        if ([string]::IsNullOrWhiteSpace($CommitMsg)) {
            Write-Host "${Red}❌ Commit message cannot be empty${Reset}"
            exit 1
        }
        git commit -m "$CommitMsg"
        Write-Host "${Green}✅ Untracked files committed${Reset}"
    }
}

Write-Host ""
Write-Host "${Blue}🔄 Pulling latest changes from remote...${Reset}"
git pull origin $CurrentBranch
if ($LASTEXITCODE -ne 0) {
    Write-Host "${Red}❌ Failed to pull from remote${Reset}"
    exit 1
}

Write-Host ""
Write-Host "${Blue}📤 Pushing to GitHub...${Reset}"
git push origin $CurrentBranch

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "${Green}✅ Successfully pushed to ${Yellow}$CurrentBranch${Green}!${Reset}"
    Write-Host ""
    Write-Host "${Blue}📤 Last pushed commits:${Reset}"
    git log --oneline -3
}
else {
    Write-Host "${Red}❌ Push failed${Reset}"
    exit 1
}

Write-Host ""
Write-Host "=================================="
