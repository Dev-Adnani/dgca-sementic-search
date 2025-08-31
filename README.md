# DGCA Aviation Reports Search System

A comprehensive system for scraping, processing, and searching Indian aviation incident and accident reports from the DGCA website.

## Project Structure

```
root/
├── python-code-backend/     # Python backend for PDF processing and vector search
├── dgca-seg-search/         # Next.js frontend for searching aviation reports
```

## Backend Features

- **Web Scraping**: Automated download of incident and accident reports from DGCA website
- **PDF Processing**: Text extraction and intelligent chunking of aviation reports
- **Vector Search**: Semantic search using OpenAI embeddings and Pinecone vector database
- **Category Support**: Separate handling of incident vs accident reports
- **Test Suite**: Comprehensive search testing capabilities

## Quick Start

### Backend Setup

```bash
cd python-code-backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys
```

### Run the Pipeline

```bash
# Download reports (optional - some included)
python run_scrapers.py

# Process PDFs and create vector database
python -m pdf2pinecone

# Test search functionality
python test_search.py "engine failure"
```

### Frontend Setup

```bash
cd dgca-seg-search
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the search interface.

## Search Examples

```bash
# Basic search
python test_search.py "hard landing"

# Category-specific search
python -m pdf2pinecone --search "fuel emergency" --category incident

# Interactive mode
python test_search.py
```

## Environment Variables

Create a `.env` file in the backend directory:

```env
OPENAI_API_KEY=your_openai_api_key_here
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_ENVIRONMENT=your_pinecone_environment
```

## Technology Stack

**Backend:**

- Python 3.9+
- OpenAI API (text-embedding-ada-002)
- Pinecone Vector Database
- PyMuPDF (PDF processing)
- Selenium WebDriver (web scraping)

**Frontend:**

- Next.js 14
- React
- Tailwind CSS
- TypeScript
- React Query (TanStack Query)
- Pinecone SDK

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is for educational and research purposes.
