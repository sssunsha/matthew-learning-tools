#!/bin/bash

# Android SDK Setup Script for macOS
# This script helps set up the Android development environment for building Cordova Android apps

echo "=========================================="
echo "Android SDK Setup Script"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo -e "${RED}Error: This script is designed for macOS only${NC}"
    exit 1
fi

echo "Step 1: Installing Java JDK 17..."
echo "-------------------------------------------"

# Check if Homebrew is installed
if ! command -v brew &> /dev/null; then
    echo -e "${RED}Homebrew is not installed. Installing Homebrew first...${NC}"
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
else
    echo -e "${GREEN}✓ Homebrew is already installed${NC}"
fi

# Install OpenJDK 17
if brew list openjdk@17 &> /dev/null; then
    echo -e "${GREEN}✓ OpenJDK 17 is already installed${NC}"
else
    echo "Installing OpenJDK 17..."
    brew install openjdk@17
fi

echo ""
echo "Step 2: Checking Android Studio..."
echo "-------------------------------------------"

ANDROID_STUDIO_PATH="/Applications/Android Studio.app"
if [ -d "$ANDROID_STUDIO_PATH" ]; then
    echo -e "${GREEN}✓ Android Studio is installed${NC}"
else
    echo -e "${YELLOW}⚠ Android Studio is not installed${NC}"
    echo ""
    echo "Please install Android Studio manually:"
    echo "1. Download from: https://developer.android.com/studio"
    echo "2. Install the .dmg file"
    echo "3. Open Android Studio and complete the setup wizard"
    echo "4. Install the following via SDK Manager:"
    echo "   - Android SDK Platform 34"
    echo "   - Android SDK Build-Tools 34.0.0"
    echo "   - Android SDK Command-line Tools (latest)"
    echo ""
    read -p "Press Enter after you have installed Android Studio..."
fi

echo ""
echo "Step 3: Setting up environment variables..."
echo "-------------------------------------------"

# Detect shell configuration file
if [ -f "$HOME/.zshrc" ]; then
    SHELL_CONFIG="$HOME/.zshrc"
elif [ -f "$HOME/.bash_profile" ]; then
    SHELL_CONFIG="$HOME/.bash_profile"
else
    SHELL_CONFIG="$HOME/.zshrc"
    touch "$SHELL_CONFIG"
fi

echo "Using configuration file: $SHELL_CONFIG"

# Check if ANDROID_HOME is already set
if grep -q "ANDROID_HOME" "$SHELL_CONFIG"; then
    echo -e "${YELLOW}⚠ ANDROID_HOME is already configured in $SHELL_CONFIG${NC}"
    echo "Current configuration:"
    grep "ANDROID_HOME" "$SHELL_CONFIG"
else
    echo "Adding ANDROID_HOME to $SHELL_CONFIG..."
    
    cat >> "$SHELL_CONFIG" << 'EOF'

# Android SDK Configuration
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin
export PATH=$PATH:$ANDROID_HOME/emulator

# Java Configuration
export PATH="/opt/homebrew/opt/openjdk@17/bin:$PATH"
EOF
    
    echo -e "${GREEN}✓ Environment variables added to $SHELL_CONFIG${NC}"
fi

echo ""
echo "Step 4: Verifying installation..."
echo "-------------------------------------------"

# Source the configuration file
source "$SHELL_CONFIG"

# Check Java
echo -n "Checking Java: "
if command -v java &> /dev/null; then
    JAVA_VERSION=$(java -version 2>&1 | head -n 1)
    echo -e "${GREEN}✓ $JAVA_VERSION${NC}"
else
    echo -e "${RED}✗ Java not found${NC}"
fi

# Check Android SDK
echo -n "Checking Android SDK: "
if [ -d "$HOME/Library/Android/sdk" ]; then
    echo -e "${GREEN}✓ Android SDK found at $HOME/Library/Android/sdk${NC}"
else
    echo -e "${YELLOW}⚠ Android SDK not found${NC}"
    echo "Please open Android Studio and install the SDK through SDK Manager"
fi

# Check sdkmanager
echo -n "Checking sdkmanager: "
if command -v sdkmanager &> /dev/null; then
    echo -e "${GREEN}✓ sdkmanager is available${NC}"
else
    echo -e "${YELLOW}⚠ sdkmanager not found. You may need to install Command-line Tools via Android Studio${NC}"
fi

echo ""
echo "=========================================="
echo "Setup Summary"
echo "=========================================="
echo ""
echo "1. Java JDK 17: Installed via Homebrew"
echo "2. Android Studio: Please verify it's installed"
echo "3. Environment variables: Added to $SHELL_CONFIG"
echo ""
echo -e "${YELLOW}IMPORTANT: Please complete these steps:${NC}"
echo ""
echo "1. Open Android Studio"
echo "2. Go to: Android Studio > Settings > Appearance & Behavior > System Settings > Android SDK"
echo "3. In 'SDK Platforms' tab, ensure 'Android 14.0 (API 34)' is checked"
echo "4. In 'SDK Tools' tab, ensure these are checked:"
echo "   - Android SDK Build-Tools 34.0.0"
echo "   - Android SDK Command-line Tools (latest)"
echo "   - Android SDK Platform-Tools"
echo "   - Android Emulator (optional)"
echo "5. Click 'Apply' to install"
echo ""
echo -e "${GREEN}After completing these steps:${NC}"
echo "1. Close and reopen your terminal"
echo "2. Run: source $SHELL_CONFIG"
echo "3. Test with: npm run android:debug"
echo ""
echo "=========================================="