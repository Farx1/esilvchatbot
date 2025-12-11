#!/bin/bash

# ESILV Smart Assistant - Quick Start Script
# This script helps you set up and run the project with different AI providers

set -e

echo "🚀 ESILV Smart Assistant - Quick Start"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}$1${NC}"
}

# Check if Node.js is installed
check_nodejs() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ first."
        echo "Visit: https://nodejs.org/"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2)
    print_status "Node.js version: $NODE_VERSION"
}

# Check if npm is installed
check_npm() {
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed."
        exit 1
    fi
    
    NPM_VERSION=$(npm -v)
    print_status "npm version: $NPM_VERSION"
}

# Install dependencies
install_dependencies() {
    print_header "📦 Installing dependencies..."
    npm install
    print_status "Dependencies installed successfully!"
}

# Setup environment file
setup_env() {
    if [ ! -f ".env" ]; then
        print_header "🔧 Setting up environment file..."
        cp .env.example .env
        print_status "Created .env file from .env.example"
        print_warning "Please edit .env file with your AI provider configuration"
        echo ""
        print_header "Available AI Providers:"
        echo "1. OpenAI (Recommended) - Set AI_PROVIDER=openai"
        echo "2. Anthropic Claude - Set AI_PROVIDER=anthropic"
        echo "3. Local Ollama - Set AI_PROVIDER=ollama"
        echo "4. Hugging Face - Set AI_PROVIDER=huggingface"
        echo "5. Z.AI (Default) - Set AI_PROVIDER=z-ai"
        echo ""
        print_status "Edit .env file and run this script again"
        exit 0
    else
        print_status "Environment file already exists"
    fi
}

# Setup database
setup_database() {
    print_header "🗄️ Setting up database..."
    npm run db:push
    print_status "Database setup completed!"
}

# Check if Ollama is running (if Ollama is selected)
check_ollama() {
    if grep -q "AI_PROVIDER=ollama" .env; then
        print_header "🦙 Checking Ollama..."
        if ! curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
            print_warning "Ollama is not running. Please start Ollama first:"
            echo "  - Install Ollama: https://ollama.ai/"
            echo "  - Start Ollama: ollama serve"
            echo "  - Pull a model: ollama pull llama2"
            echo ""
            read -p "Do you want to continue anyway? (y/n): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                exit 1
            fi
        else
            print_status "Ollama is running!"
        fi
    fi
}

# Start development server
start_server() {
    print_header "🚀 Starting development server..."
    echo ""
    print_status "The application will be available at:"
    echo "  🌐 Main Chatbot: http://localhost:3000"
    echo "  📊 Admin Dashboard: http://localhost:3000/admin"
    echo "  📄 Documents: http://localhost:3000/documents"
    echo ""
    print_status "Press Ctrl+C to stop the server"
    echo ""
    npm run dev
}

# Main execution
main() {
    print_header "🔍 Checking prerequisites..."
    check_nodejs
    check_npm
    
    print_header "🔧 Setting up project..."
    install_dependencies
    setup_env
    setup_database
    check_ollama
    
    start_server
}

# Handle script arguments
case "${1:-}" in
    "install")
        check_nodejs
        check_npm
        install_dependencies
        ;;
    "setup")
        setup_env
        setup_database
        ;;
    "dev")
        check_ollama
        start_server
        ;;
    "help"|"-h"|"--help")
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  install    Install dependencies only"
        echo "  setup      Setup environment and database"
        echo "  dev        Start development server"
        echo "  help       Show this help message"
        echo ""
        echo "If no command is provided, the full setup and start process will run."
        ;;
    "")
        main
        ;;
    *)
        print_error "Unknown command: $1"
        echo "Run '$0 help' for available commands."
        exit 1
        ;;
esac