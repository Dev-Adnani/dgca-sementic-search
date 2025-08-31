# DGCA Aviation Reports - Python Backend

Backend system for processing and searching Indian aviation incident and accident reports.

## Features

- **Automated Web Scraping**: Downloads reports from DGCA website
- **PDF Text Extraction**: Processes aviation reports using PyMuPDF
- **Vector Search**: Semantic search using OpenAI embeddings and Pinecone
- **Category Support**: Handles both incident and accident reports
- **Parallel Processing**: Efficient batch processing of documents
- **Test Suite**: Comprehensive search testing

## Project Structure

```
python-code-backend/
├── pdf2pinecone/           # Main processing package
│   ├── __init__.py
│   ├── __main__.py         # CLI entry point
│   ├── config.py           # Configuration management
│   ├── pdf_utils.py        # PDF processing utilities
│   ├── pinecone_utils.py   # Vector database operations
│   └── logging_config.py   # Logging setup
├── scrapers/               # Web scraping (legacy notebooks included)
│   ├── __init__.py
│   ├── incident_scraper.py # DGCA incident reports scraper
│   └── accident_scraper.py # DGCA accident reports scraper
├── run_scrapers.py         # Master scraper runner
├── test_search.py          # Search testing utility
├── requirements.txt        # Python dependencies
├── .env                    # Environment variables
└── .venv/                  # Virtual environment
```

## Installation

1. **Set up Python environment:**

   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Configure environment variables:**
   ```bash
   # Create .env file with:
   OPENAI_API_KEY=your_openai_api_key_here
   PINECONE_API_KEY=your_pinecone_api_key_here
   PINECONE_ENVIRONMENT=your_pinecone_environment
   ```

## Usage

### 1. Download Reports (Optional)

```bash
# Download latest incident and accident reports
python run_scrapers.py
```

### 2. Process PDFs and Create Vector Database

```bash
# Process all PDFs and upload to Pinecone
python -m pdf2pinecone
```

### 3. Search Reports

```bash
# Quick search test
python test_search.py "engine failure"

# Interactive search mode
python test_search.py

# Advanced search with category filter
python -m pdf2pinecone --search "hard landing" --category incident
```

## Search Examples

```bash
# Engine-related incidents
python test_search.py "engine shutdown"

# Landing incidents
python test_search.py "hard landing runway"

# Emergency situations
python test_search.py "emergency descent"

# Specific aircraft
python test_search.py "boeing 737"
```

## API Reference

### Command Line Interface

```bash
# Process all PDFs
python -m pdf2pinecone

# Search with filters
python -m pdf2pinecone --search "query" --category incident --limit 10

# Reprocess specific folders
python -m pdf2pinecone --incident-folder ./pdfs/incidents --accident-folder ./pdfs/accidents
```

### Test Search Utility

```bash
# Single query
python test_search.py "search query"

# Interactive mode
python test_search.py

# Help
python test_search.py --help
```

## Configuration

### Environment Variables

- `OPENAI_API_KEY`: OpenAI API key for embeddings
- `PINECONE_API_KEY`: Pinecone API key for vector database
- `PINECONE_ENVIRONMENT`: Pinecone environment (e.g., "us-east-1-aws")

### Default Settings

- **Index Name**: `dgca-reports`
- **Embedding Model**: `text-embedding-ada-002`
- **Chunk Size**: 1000 characters with 200 character overlap
- **Batch Size**: 100 vectors per upload

## Data Processing Pipeline

1. **PDF Discovery**: Scans incident and accident folders
2. **Text Extraction**: Extracts text using PyMuPDF
3. **Chunking**: Splits text into searchable chunks
4. **Embedding Generation**: Creates vector embeddings via OpenAI
5. **Vector Storage**: Uploads to Pinecone with metadata
6. **Search Interface**: Provides semantic search capabilities

## Performance

- **Processing Speed**: ~150 PDFs processed in 2-3 minutes
- **Search Speed**: Sub-second semantic search results
- **Accuracy**: High relevance scoring with semantic matching
- **Scalability**: Supports thousands of documents

## Troubleshooting

### Common Issues

1. **Import Errors**: Ensure virtual environment is activated
2. **API Limits**: Check OpenAI API usage and limits
3. **Connection Issues**: Verify Pinecone environment configuration
4. **PDF Processing**: Some PDFs may have text extraction issues

### Debug Mode

```bash
# Enable verbose logging
export LOG_LEVEL=DEBUG
python -m pdf2pinecone
```

## Contributing

1. Follow PEP 8 style guidelines
2. Add tests for new features
3. Update documentation
4. Test search functionality after changes

## Dependencies

Key packages:

- `openai`: OpenAI API client
- `pinecone-client`: Pinecone vector database
- `PyMuPDF`: PDF text extraction
- `selenium`: Web scraping
- `python-dotenv`: Environment management
