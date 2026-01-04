# Technical Report - Compilation Guide

## Document Overview

**File:** `TECHNICAL_REPORT.tex`  
**Title:** ESILV Smart Assistant: A Multi-Agent Retrieval-Augmented Generation System  
**Pages:** 8-10 pages (when compiled)  
**Format:** LaTeX academic report  
**Language:** English

## Contents

1. **Title Page & Abstract** - Project overview and key results
2. **Introduction** (1.5 pages) - Problem statement, background, challenges
3. **System Architecture** (2 pages) - Components, API routes, database schema
4. **Implementation Pipeline** (2 pages) - Knowledge base construction, query processing, document upload, web scraping
5. **Evaluation & Results** (1.5 pages) - Metrics, validation, example interactions
6. **Technical Challenges** (1.5 pages) - 5 major challenges and solutions
7. **Future Work** (1 page) - Technical enhancements, features, research directions
8. **Conclusion** (0.5 pages) - Achievements, impact, lessons learned
9. **References** - 15 citations

## Compilation Instructions

### Prerequisites

You need a LaTeX distribution installed:

**Windows:**
```bash
# Install MiKTeX (recommended)
winget install MiKTeX.MiKTeX

# Or install TeX Live
choco install texlive
```

**macOS:**
```bash
# Install MacTeX
brew install --cask mactex
```

**Linux:**
```bash
# Ubuntu/Debian
sudo apt-get install texlive-full

# Fedora
sudo dnf install texlive-scheme-full
```

### Compile to PDF

**Method 1: Using pdflatex (recommended)**
```bash
cd docs
pdflatex TECHNICAL_REPORT.tex
pdflatex TECHNICAL_REPORT.tex  # Run twice for TOC and references
```

**Method 2: Using latexmk (automatic)**
```bash
cd docs
latexmk -pdf TECHNICAL_REPORT.tex
```

**Method 3: Online (Overleaf)**
1. Go to https://www.overleaf.com
2. Create new project → Upload Project
3. Upload `TECHNICAL_REPORT.tex`
4. Click "Recompile"

### Output

After compilation, you'll find:
- `TECHNICAL_REPORT.pdf` - The final PDF report (8-10 pages)
- `TECHNICAL_REPORT.aux`, `.log`, `.toc` - Auxiliary files (can be deleted)

## Document Structure

### Key Features

- **Professional Formatting**: IEEE-style academic layout with 11pt font, 1-inch margins
- **Visual Diagrams**: TikZ-based architecture and flow diagrams
- **Syntax Highlighted Code**: JavaScript/TypeScript code snippets with colors
- **Tables & Metrics**: Performance metrics, validation results, comparison tables
- **Hyperlinks**: All URLs, references, and internal sections are clickable
- **Table of Contents**: Automatic generation with page numbers

### Sections Detail

#### Section 1: Introduction (Pages 1-2)
- Background on ESILV and project motivation
- Complete problem statement breakdown
- Technical challenges identified
- Solution approach overview

#### Section 2: System Architecture (Pages 2-4)
- High-level architecture diagram (TikZ)
- Frontend layer (React, Next.js UI)
- Backend API routes (10+ endpoints)
- Database schema (Prisma models)
- AI provider configuration (5 LLM providers)

#### Section 3: Implementation Pipeline (Pages 4-6)
- Knowledge base construction (125+ manual + 200+ scraped)
- Multi-agent query processing with sequence diagram
- Document upload pipeline (PDF/DOCX/TXT/MD)
- Web scraping & data freshness system
- Chunking algorithm with pseudocode

#### Section 4: Evaluation & Results (Pages 6-7)
- Quantitative metrics table
- Automated validation script results
- 4 example interactions with actual outputs
- Performance analysis (response times, accuracy)

#### Section 5: Technical Challenges (Pages 7-8)
- **Challenge 1**: ESM module compatibility (JSDOM → Cheerio)
- **Challenge 2**: PDF parsing (pdf-parse → pdf-parse-fork)
- **Challenge 3**: Data freshness (parallel verification system)
- **Challenge 4**: Large document processing (50MB support)
- **Challenge 5**: Multi-agent coordination (intent analysis)

#### Section 6: Future Work (Page 9)
- Vector embeddings for semantic search
- True streaming responses
- Caching layer (Redis)
- PostgreSQL migration
- Multi-language support
- Voice interface
- Custom fine-tuned LLM
- Multi-modal RAG
- Graph RAG
- RLHF

#### Section 7: Conclusion (Page 10)
- Summary of achievements
- Technical contributions
- Demonstration of AI/ML concepts
- Project impact
- Lessons learned

#### References (Page 10)
- 15 academic and technical references
- Next.js, Prisma, Ollama, Gemini documentation
- RAG research papers
- Multi-agent systems papers

## Customization

### Updating Author Information

Edit lines 54-66 in `TECHNICAL_REPORT.tex`:
```latex
{\large\itshape Your Name\par}
{\large Your Program\par}
{\large\textbf{Project Supervisor:} Supervisor Name\par}
```

### Adding More Diagrams

Use TikZ for custom diagrams. Example template:
```latex
\begin{figure}[h]
\centering
\begin{tikzpicture}[node distance=2cm]
  \node (start) [startstop] {Start};
  \node (end) [startstop, below of=start] {End};
  \draw [arrow] (start) -- (end);
\end{tikzpicture}
\caption{Your diagram description}
\label{fig:your-label}
\end{figure}
```

### Changing Colors

Modify code listing colors (lines 28-33):
```latex
\definecolor{codegreen}{rgb}{0,0.6,0}
\definecolor{codegray}{rgb}{0.5,0.5,0.5}
\definecolor{codepurple}{rgb}{0.58,0,0.82}
```

## Troubleshooting

### Missing Packages Error

If you get "File X.sty not found":
```bash
# MiKTeX (Windows)
mpm --install=missing

# TeX Live (Mac/Linux)
sudo tlmgr install <package-name>
```

### TikZ Compilation Errors

If diagrams don't compile:
```bash
# Install TikZ explicitly
sudo tlmgr install pgf tikz-cd
```

### Bibliography Not Showing

References are manual (not BibTeX). They're already included in the document.

### PDF Too Large

If PDF file size is too large:
```bash
# Compress PDF
gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 \
   -dPDFSETTINGS=/ebook -dNOPAUSE -dQUIET \
   -dBATCH -sOutputFile=TECHNICAL_REPORT_compressed.pdf \
   TECHNICAL_REPORT.pdf
```

## Tips

1. **Run pdflatex twice** - First run generates TOC, second run updates page numbers
2. **Check .log file** - If compilation fails, check `TECHNICAL_REPORT.log` for errors
3. **Use online editor** - Overleaf is easier if you don't want to install LaTeX locally
4. **Export as Word** - Use `pandoc` to convert to DOCX if needed:
   ```bash
   pandoc TECHNICAL_REPORT.tex -o TECHNICAL_REPORT.docx
   ```

## Final Checklist

Before submission:
- [ ] Compiled successfully to PDF
- [ ] Table of contents shows correct page numbers
- [ ] All diagrams render correctly
- [ ] Code snippets are readable
- [ ] Author information is updated
- [ ] References are complete
- [ ] PDF is 8-10 pages
- [ ] No compilation warnings in .log file

## Contact

**Author:** Jules Barth  
**Email:** julesbarth13@gmail.com  
**GitHub:** https://github.com/Farx1/esilvchatbot  
**Portfolio:** https://julesbarth-myportfolio.fr

---

**Report Generated:** January 4, 2026  
**Version:** 1.2.0  
**Format:** LaTeX Academic Report

