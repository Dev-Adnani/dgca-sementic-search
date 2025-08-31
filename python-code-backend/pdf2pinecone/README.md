# PDF to Pinecone Vector Database Pipeline

## Features

- Modular codebase: utilities for PDF, Pinecone, config, and logging
- Support for multiple PDF categories (incident/accident) with filtering
- Parallel embedding generation for speed
- Progress bars for user feedback
- Robust error handling and logging (to file and console)
- All parameters configurable via CLI or .env
- Efficient batch upserts to Pinecone
- Metadata includes chunk text for semantic search
- Test search with content preview and category filtering

## Usage

1. Install requirements:
   ```sh
   pip install PyMuPDF openai pinecone python-dotenv tqdm
   ```
2. Set up your `.env` file:
   ```env
   OPENAI_API_KEY=your_openai_api_key
   PINECONE_API_KEY=your_pinecone_api_key
   PINECONE_ENVIRONMENT=your_pinecone_environment
   # Optional overrides
   INCIDENT_FOLDER=./pdfs/incident
   ACCIDENT_FOLDER=./pdfs/accident
   INDEX_NAME=dgca-reports
   CHUNK_SIZE=500
   CHUNK_OVERLAP=50
   ```
3. Place PDFs in the appropriate folders:
   - Incident reports: `./pdfs/incident/`
   - Accident reports: `./pdfs/accident/`
4. Run the pipeline:

   ```sh
   # Process both categories and search all
   python -m pdf2pinecone --test-query "engine failure"

   # Search only incidents
   python -m pdf2pinecone --test-query "engine failure" --category incident

   # Search only accidents
   python -m pdf2pinecone --test-query "engine failure" --category accident
   ```

   Or see all options:

   ```sh
   python -m pdf2pinecone --help
   ```
