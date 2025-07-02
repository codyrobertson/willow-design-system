#!/bin/bash

# Test Runner Script for Willow CLI
# Provides easy access to different test groups

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Default to showing help
MODE=${1:-help}

case $MODE in
  "help")
    echo -e "${BLUE}Willow CLI Test Runner${NC}"
    echo
    echo "Available test modes:"
    echo -e "  ${GREEN}fast${NC}         - Run only fast unit tests (excludes integration/stress tests)"
    echo -e "  ${GREEN}unit${NC}         - Run unit tests (excludes integration tests)"
    echo -e "  ${GREEN}integration${NC}  - Run integration and performance tests"
    echo -e "  ${GREEN}all${NC}          - Run all tests with max parallelization"
    echo -e "  ${GREEN}watch${NC}        - Run tests in watch mode"
    echo -e "  ${GREEN}coverage${NC}     - Run tests with coverage report"
    echo
    echo "Usage: npm run test:<mode>"
    echo "   or: ./scripts/test-runner.sh <mode>"
    echo
    echo -e "${YELLOW}Tip:${NC} Use 'npm run test:fast' for rapid feedback during development"
    ;;
    
  "fast")
    echo -e "${BLUE}Running fast unit tests only...${NC}"
    npm run test:fast
    ;;
    
  "unit")
    echo -e "${BLUE}Running unit tests...${NC}"
    npm run test:unit
    ;;
    
  "integration")
    echo -e "${YELLOW}Running integration tests (this may take a while)...${NC}"
    npm run test:integration
    ;;
    
  "all")
    echo -e "${BLUE}Running all tests...${NC}"
    npm run test:all
    ;;
    
  "watch")
    echo -e "${BLUE}Starting test watcher...${NC}"
    npm run test:watch
    ;;
    
  "coverage")
    echo -e "${BLUE}Running tests with coverage...${NC}"
    npm run test:coverage
    ;;
    
  *)
    echo -e "${RED}Unknown test mode: $MODE${NC}"
    echo "Run './scripts/test-runner.sh help' for available options"
    exit 1
    ;;
esac