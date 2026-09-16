#!/bin/bash

# Set error handling
set -e

# Print logo
echo "╔════════════════════════════════════════════════════════╗"
echo "║       ©️  Mewn                                      ║"
echo "║       Candid - Miles apart. Frames together.      ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "Installing Candid dependencies..."

# Install client dependencies
echo "Installing client dependencies..."
cd client
npm install
cd ..

# Install server dependencies
echo "Installing server dependencies..."
cd server
npm install
cd ..

echo ""
echo "✅  Setup complete!"
echo ""
echo "To start development (client + server):"
echo "  npm run dev"
echo ""
echo "To run typecheck:"
echo "  npm run typecheck"
echo ""
echo "To run tests:"
echo "  npm test"