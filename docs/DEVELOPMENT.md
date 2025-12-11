# ESILV Smart Assistant - Setup Guide for Cursor

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- Cursor IDE installed
- Git installed

### Installation Steps

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd esilv-smart-assistant
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup environment variables**
```bash
cp .env.example .env
```

Edit `.env` file with your configuration:

```env
# Database
DATABASE_URL="file:./dev.db"

# AI Model Configuration
# Choose ONE of the following options:

## Option 1: OpenAI (Recommended for production)
OPENAI_API_KEY="your-openai-api-key"
AI_PROVIDER="openai"
OPENAI_MODEL="gpt-4"

## Option 2: Anthropic Claude
ANTHROPIC_API_KEY="your-anthropic-api-key"
AI_PROVIDER="anthropic"
ANTHROPIC_MODEL="claude-3-sonnet-20240229"

## Option 3: Local LLM with Ollama
AI_PROVIDER="ollama"
OLLAMA_BASE_URL="http://localhost:11434"
OLLAMA_MODEL="llama2" # or mistral, codellama, etc.

## Option 4: Hugging Face
HUGGINGFACE_API_KEY="your-huggingface-api-key"
AI_PROVIDER="huggingface"
HUGGINGFACE_MODEL="microsoft/DialoGPT-medium"

## Option 5: Google Gemini
AI_PROVIDER="gemini"
GEMINI_API_KEY="your-gemini-api-key"
GEMINI_MODEL="gemini-2.0-flash-exp"

# Next.js
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"
```

4. **Initialize database**
```bash
npm run db:push
npm run db:seed  # Optional: seed with sample data
```

5. **Start development server**
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## 🤖 AI Model Configuration

### Switching Between AI Providers

The project supports multiple AI providers. You can switch between them by changing the `AI_PROVIDER` environment variable:

#### 1. OpenAI (Recommended)
- Best performance and reliability
- Supports GPT-3.5, GPT-4, GPT-4-turbo
- Cost-effective for production

#### 2. Anthropic Claude
- Excellent for conversational AI
- Strong reasoning capabilities
- Good for complex queries

#### 3. Local LLM with Ollama
- Complete privacy (data stays local)
- Free to use
- Requires good hardware
- Limited model capabilities

#### 4. Hugging Face
- Wide variety of models
- Good for specialized tasks
- Can be cost-effective

#### 5. Z.AI Web SDK (Default)
- Easy to setup
- Good performance
- Built-in web search capabilities

### Local LLM Setup with Ollama

1. **Install Ollama**
```bash
# macOS
brew install ollama

# Linux
curl -fsSL https://ollama.ai/install.sh | sh

# Windows
# Download from https://ollama.ai/download
```

2. **Pull a model**
```bash
ollama pull llama2
# or
ollama pull mistral
# or
ollama pull codellama
```

3. **Start Ollama server**
```bash
ollama serve
```

4. **Update .env**
```env
AI_PROVIDER="ollama"
OLLAMA_BASE_URL="http://localhost:11434"
OLLAMA_MODEL="llama2"
```

## 🔧 Cursor Configuration

### 1. Install Cursor Extensions
Install these extensions in Cursor:
- ES7+ React/Redux/React-Native snippets
- Prettier - Code formatter
- ESLint
- Tailwind CSS IntelliSense
- Prisma
- GitLens

### 2. Configure Cursor Settings
Add to your Cursor `settings.json`:

```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "tailwindCSS.includeLanguages": {
    "typescript": "javascript",
    "typescriptreact": "html"
  },
  "files.associations": {
    "*.css": "tailwindcss"
  },
  "emmet.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  }
}
```

### 3. Cursor Tasks Configuration
Create `.cursor/tasks.json`:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Start Development Server",
      "type": "shell",
      "command": "npm run dev",
      "group": "build",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "new"
      }
    },
    {
      "label": "Database Push",
      "type": "shell",
      "command": "npm run db:push",
      "group": "build"
    },
    {
      "label": "Database Seed",
      "type": "shell",
      "command": "npm run db:seed",
      "group": "build"
    },
    {
      "label": "Lint Code",
      "type": "shell",
      "command": "npm run lint",
      "group": "build"
    }
  ]
}
```

## 🏗️ Project Structure

```
src/
├── app/
│   ├── admin/           # Admin dashboard
│   ├── api/            # API routes
│   ├── documents/      # Document management
│   ├── globals.css     # Global styles
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Main chatbot page
├── components/
│   ├── ui/             # shadcn/ui components
│   ├── Navigation.tsx  # Navigation component
│   └── Timestamp.tsx   # Timestamp component
├── hooks/
│   └── use-api.ts      # API hooks
├── lib/
│   └── db.ts           # Database client
└── prisma/
    └── schema.prisma   # Database schema
```

## 🎯 Key Features

### Multi-Agent System
- **Retrieval Agent**: Handles information retrieval from knowledge base
- **Form Filling Agent**: Manages user data collection
- **Orchestration Agent**: Coordinates between agents and manages conversation flow

### Core Functionality
- Real-time chat interface with Framer Motion animations
- Admin dashboard with analytics and conversation management
- Document management system
- Feedback system with satisfaction tracking
- Responsive design with Tailwind CSS

### Database
- Prisma ORM with SQLite
- Conversation history tracking
- User management
- Form submissions storage
- Knowledge base management

## 🚀 Deployment

### Local Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

### Environment-Specific Builds
```bash
# Development
npm run build:dev

# Production
npm run build:prod

# Docker
docker build -t esilv-assistant .
docker run -p 3000:3000 esilv-assistant
```

## 🔍 Troubleshooting

### Common Issues

1. **Database Connection Error**
   ```bash
   npm run db:push
   ```

2. **AI Model Not Responding**
   - Check your API keys in `.env`
   - Verify AI_PROVIDER is set correctly
   - For local models, ensure Ollama is running

3. **Port Already in Use**
   ```bash
   lsof -ti:3000 | xargs kill -9
   ```

4. **Dependencies Issues**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

### Debug Mode
Enable debug logging by setting:
```env
DEBUG=true
LOG_LEVEL=debug
```

## 📚 Development Guidelines

### Code Style
- Use TypeScript for all new code
- Follow ESLint configuration
- Use Prettier for formatting
- Write meaningful commit messages

### Component Development
- Use shadcn/ui components when possible
- Follow the existing component structure
- Implement proper error handling
- Add loading states

### API Development
- Use proper HTTP status codes
- Implement error handling
- Add input validation
- Document API endpoints

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

---

## 🎯 Quick Commands Reference

```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server

# Database
npm run db:push          # Push schema to database
npm run db:seed          # Seed database with sample data
npm run db:studio        # Open Prisma Studio

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues
npm run type-check       # Run TypeScript checks

# Testing
npm run test             # Run tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage
```

Enjoy building with ESILV Smart Assistant! 🚀