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
- **Document Summaries**: AI-generated summaries (3-6 key points) for each document during processing
- **Structure Extraction**: Automatic extraction of headings, sections, and table of contents from PDFs
- **URL Mapping**: Extraction and storage of DGCA website URLs for direct PDF access
- **Vector Search**: Semantic search using OpenAI embeddings and Pinecone vector database
- **Category Support**: Separate handling of incident vs accident reports
- **Test Suite**: Comprehensive search testing capabilities

## Frontend Features

- **Modern Web Interface**: Clean, responsive UI for searching aviation reports
- **Real-time Search**: Fast, semantic search with live results
- **Advanced Filters**: Category-based filtering (incident vs accident)
- **Per-Report Summaries**: Expandable accordion showing document summary for each search result
- **Direct PDF Access**: "View PDF" button linking directly to DGCA website for each report
- **Search Result Highlighting**: Query terms highlighted in search results
- **Responsive Design**: Mobile-friendly interface

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
# Step 1: Download reports (extracts data-url and downloads PDFs)
python run_scrapers.py

# Step 2: Process PDFs and create vector database (with summaries)
python -m pdf2pinecone

# Step 3: Test search functionality
python test_search.py "engine failure"
```

**Note**: If you already have PDFs downloaded before adding the URL extraction feature, you can extract URLs without re-downloading:

```bash
# Extract data-url mappings for existing PDFs
python extract_data_urls.py

# Then re-run PDF processing to add URLs to metadata
python -m pdf2pinecone
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

### Backend (.env in python-code-backend/)

```env
OPENAI_API_KEY=your_openai_api_key_here
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_ENVIRONMENT=us-east-1
INDEX_NAME=dgca-reports
CHUNK_SIZE=500
CHUNK_OVERLAP=50
```

### Frontend (.env.local in dgca-seg-search/)

```env
OPENAI_API_KEY=your_openai_api_key_here
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_INDEX_NAME=dgca-reports
```

**Important**: Use the same API keys and index name in both files.

## Key Features

### Document Summarization
- **Automatic Summaries**: Each PDF is analyzed and summarized with 3-6 key points during processing
- **Structure-Aware**: Uses PDF structure (headings, TOC) to identify important sections
- **Per-Report Display**: Each search result shows its own expandable summary accordion

### Direct PDF Access
- **URL Extraction**: Scrapers extract `data-url` attributes from DGCA website
- **URL Mapping**: Stores filename-to-URL mappings for direct access
- **View PDF Button**: One-click access to original PDF on DGCA website

### Search Capabilities
- **Semantic Search**: Uses OpenAI embeddings for meaning-based search
- **Category Filtering**: Filter by incident or accident reports
- **Result Highlighting**: Query terms highlighted in search results
- **Score Display**: Relevance scores shown for each result

## Technology Stack

**Backend:**

- Python 3.9+
- OpenAI API (text-embedding-ada-002 for embeddings, gpt-4o-mini for summaries)
- Pinecone Vector Database
- PyMuPDF (PDF processing and structure extraction)
- Selenium WebDriver (web scraping)
- tqdm (progress bars)

**Frontend:**

- Next.js 15
- React 19
- Tailwind CSS
- TypeScript
- React Query (TanStack Query)
- Pinecone SDK
- Lucide React (icons)

## Data Processing Pipeline

1. **Scraping**: Download PDFs from DGCA website and extract `data-url` attributes
2. **Text Extraction**: Extract text content from PDFs using PyMuPDF
3. **Structure Analysis**: Identify headings, sections, and table of contents
4. **Summary Generation**: Generate document-level summaries using GPT-4o-mini
5. **Chunking**: Split text into searchable chunks (500 words with 50 word overlap)
6. **Embedding**: Create vector embeddings for each chunk using OpenAI
7. **Storage**: Upload to Pinecone with metadata (summary, URL, category, etc.)
8. **Search**: Semantic search with category filtering and result highlighting

## File Structure

```
dgca-sementic-search/
├── python-code-backend/
│   ├── scrapers/              # Web scrapers for DGCA reports
│   │   ├── incident_scraper.py
│   │   └── accident_scraper.py
│   ├── pdf2pinecone/          # PDF processing and vectorization
│   │   ├── __main__.py        # Main processing pipeline
│   │   ├── pdf_utils.py       # PDF extraction and summarization
│   │   └── pinecone_utils.py  # Vector database operations
│   ├── extract_data_urls.py  # Extract URLs for existing PDFs
│   ├── run_scrapers.py        # Master scraper runner
│   └── test_search.py         # Search testing utility
├── dgca-seg-search/           # Next.js frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── api/search/    # Search API endpoint
│   │   │   └── page.tsx       # Main search page
│   │   └── components/
│   │       ├── search-result-card.tsx  # Result card with summary
│   │       └── search-summary.tsx      # Summary component
│   └── package.json
└── README.md
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is for educational and research purposes.
