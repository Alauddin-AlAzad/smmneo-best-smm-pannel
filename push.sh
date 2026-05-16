#!/bin/bash

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 GitHub Push Command${NC}"
echo "=================================="
echo ""

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
  echo -e "${RED}❌ Not in a git repository${NC}"
  exit 1
fi

# Get current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo -e "${BLUE}📍 Current branch: ${GREEN}$CURRENT_BRANCH${NC}"
echo ""

# Show git status
echo -e "${BLUE}📊 Git Status:${NC}"
git status --short
echo ""

# Show last 3 commits
echo -e "${BLUE}📜 Last 3 commits:${NC}"
git log --oneline -3
echo ""

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
  echo -e "${YELLOW}⚠️  You have uncommitted changes. Would you like to commit them? (y/n)${NC}"
  read -r COMMIT_CHOICE
  if [ "$COMMIT_CHOICE" = "y" ] || [ "$COMMIT_CHOICE" = "Y" ]; then
    echo -e "${BLUE}📝 Enter commit message:${NC}"
    read -r COMMIT_MSG
    if [ -z "$COMMIT_MSG" ]; then
      echo -e "${RED}❌ Commit message cannot be empty${NC}"
      exit 1
    fi
    git add .
    git commit -m "$COMMIT_MSG"
    echo -e "${GREEN}✅ Changes committed${NC}"
  fi
fi

# Check for untracked files
UNTRACKED=$(git ls-files --others --exclude-standard)
if [ -n "$UNTRACKED" ]; then
  echo -e "${YELLOW}⚠️  You have untracked files:${NC}"
  echo "$UNTRACKED"
  echo -e "${YELLOW}Would you like to add them? (y/n)${NC}"
  read -r ADD_CHOICE
  if [ "$ADD_CHOICE" = "y" ] || [ "$ADD_CHOICE" = "Y" ]; then
    git add .
    echo -e "${BLUE}📝 Enter commit message for untracked files:${NC}"
    read -r COMMIT_MSG
    if [ -z "$COMMIT_MSG" ]; then
      echo -e "${RED}❌ Commit message cannot be empty${NC}"
      exit 1
    fi
    git commit -m "$COMMIT_MSG"
    echo -e "${GREEN}✅ Untracked files committed${NC}"
  fi
fi

echo ""
echo -e "${BLUE}🔄 Pulling latest changes from remote...${NC}"
git pull origin "$CURRENT_BRANCH" || {
  echo -e "${RED}❌ Failed to pull from remote${NC}"
  exit 1
}

echo ""
echo -e "${BLUE}📤 Pushing to GitHub...${NC}"
git push origin "$CURRENT_BRANCH"

if [ $? -eq 0 ]; then
  echo ""
  echo -e "${GREEN}✅ Successfully pushed to ${YELLOW}$CURRENT_BRANCH${GREEN}!${NC}"
  echo ""
  echo -e "${BLUE}📤 Last pushed commits:${NC}"
  git log --oneline -3
else
  echo -e "${RED}❌ Push failed${NC}"
  exit 1
fi

echo ""
echo "=================================="
