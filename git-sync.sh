#!/bin/bash
# ============================================================================
# TALENTA-TZ - AUTOMATIC GIT SYNC SCRIPT
# Pulls latest changes from GitHub and pushes local changes automatically
# ============================================================================

echo "╔══════════════════════════════════════════════════════════════════════════════╗"
echo "║                                                                              ║"
echo "║              🔄 TALENTA-TZ - GIT AUTO SYNC STARTING...                      ║"
echo "║                                                                              ║"
echo "╚══════════════════════════════════════════════════════════════════════════════╝"
echo ""

# Define colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR" || exit 1

echo -e "${BLUE}📁 Working Directory: $SCRIPT_DIR${NC}"
echo ""

# ============================================================================
# STEP 1: CHECK GIT STATUS
# ============================================================================
echo -e "${BLUE}Step 1: Checking Git Status...${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
git status
echo ""

# ============================================================================
# STEP 2: PULL LATEST CHANGES FROM GITHUB
# ============================================================================
echo -e "${BLUE}Step 2: Pulling Latest Changes from GitHub...${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if git pull origin main --quiet; then
    echo -e "${GREEN}✅ Successfully pulled latest changes from GitHub${NC}"
else
    echo -e "${YELLOW}⚠️  Could not pull (might already be up to date or no internet)${NC}"
fi
echo ""

# ============================================================================
# STEP 3: CHECK FOR LOCAL CHANGES
# ============================================================================
echo -e "${BLUE}Step 3: Checking for Local Changes...${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

CHANGED_FILES=$(git diff --name-only)
UNTRACKED_FILES=$(git ls-files --others --exclude-standard)

if [ -z "$CHANGED_FILES" ] && [ -z "$UNTRACKED_FILES" ]; then
    echo -e "${GREEN}✅ No local changes to commit${NC}"
    CHANGES_EXIST=false
else
    echo -e "${YELLOW}📝 Found local changes:${NC}"
    if [ ! -z "$CHANGED_FILES" ]; then
        echo -e "${YELLOW}Modified files:${NC}"
        echo "$CHANGED_FILES" | sed 's/^/  - /'
    fi
    if [ ! -z "$UNTRACKED_FILES" ]; then
        echo -e "${YELLOW}Untracked files:${NC}"
        echo "$UNTRACKED_FILES" | sed 's/^/  - /'
    fi
    CHANGES_EXIST=true
fi
echo ""

# ============================================================================
# STEP 4: PUSH LOCAL CHANGES TO GITHUB
# ============================================================================
echo -e "${BLUE}Step 4: Pushing Local Changes to GitHub...${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ "$CHANGES_EXIST" = true ]; then
    # Add all changes
    git add .
    
    # Get current timestamp for commit message
    TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")
    
    # Commit changes
    if git commit -m "sync: auto-sync from $(hostname) - $TIMESTAMP" --quiet; then
        echo -e "${GREEN}✅ Committed changes locally${NC}"
        
        # Push to GitHub
        if git push origin main --quiet; then
            echo -e "${GREEN}✅ Successfully pushed changes to GitHub${NC}"
        else
            echo -e "${RED}❌ Failed to push to GitHub${NC}"
            echo "   Try: git push origin main"
        fi
    else
        echo -e "${YELLOW}⚠️  No new changes to commit${NC}"
    fi
else
    echo -e "${GREEN}✅ No changes to push${NC}"
fi
echo ""

# ============================================================================
# STEP 5: SHOW SYNC STATUS
# ============================================================================
echo -e "${BLUE}Step 5: Final Git Status${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
git log --oneline -3
echo ""

# ============================================================================
# DONE
# ============================================================================
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                                              ║${NC}"
echo -e "${GREEN}║                   ✅ GIT SYNC COMPLETE! ✅                                   ║${NC}"
echo -e "${GREEN}║                                                                              ║${NC}"
echo -e "${GREEN}║         Your local and GitHub repositories are now in sync! 🚀              ║${NC}"
echo -e "${GREEN}║                                                                              ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📊 Sync Summary:${NC}"
echo "   ✓ Pulled latest changes from GitHub"
echo "   ✓ Committed local changes"
echo "   ✓ Pushed to GitHub"
echo "   ✓ Ready to work!"
echo ""
