import argparse
import glob
import os
import logging
from tqdm import tqdm
from pdf2pinecone.config import load_config
from pdf2pinecone.logger import setup_logger
from pdf2pinecone.pdf_utils import extract_text_from_pdf, clean_text
from pdf2pinecone.pinecone_utils import create_chunks, setup_pinecone_index, upload_to_pinecone
import openai
from pinecone import Pinecone

def main():
    parser = argparse.ArgumentParser(description="PDF to Pinecone Vector Database Pipeline")
    parser.add_argument('--incident-folder', type=str, help='Path to incident PDFs folder')
    parser.add_argument('--accident-folder', type=str, help='Path to accident PDFs folder')
    parser.add_argument('--index-name', type=str, help='Pinecone index name')
    parser.add_argument('--chunk-size', type=int, help='Words per chunk')
    parser.add_argument('--chunk-overlap', type=int, help='Overlapping words per chunk')
    parser.add_argument('--log-file', type=str, help='Log file path')
    parser.add_argument('--log-level', type=str, default='INFO', help='Log level')
    parser.add_argument('--test-query', type=str, help='Run a test search after upload')
    parser.add_argument('--category', type=str, choices=['incident', 'accident'], help='Filter search by category')
    args = parser.parse_args()

    config = load_config()
    pdf_folders = {
        'incident': args.incident_folder or config['PDF_FOLDERS']['incident'],
        'accident': args.accident_folder or config['PDF_FOLDERS']['accident']
    }
    index_name = args.index_name or config['INDEX_NAME']
    chunk_size = args.chunk_size or config['CHUNK_SIZE']
    chunk_overlap = args.chunk_overlap or config['CHUNK_OVERLAP']
    log_file = args.log_file
    log_level = args.log_level
    setup_logger(log_file, log_level)

    openai.api_key = config['OPENAI_API_KEY']
    if not openai.api_key:
        raise ValueError("OPENAI_API_KEY not found in environment variables")
    pc = Pinecone(api_key=config['PINECONE_API_KEY'])
    if not config['PINECONE_API_KEY']:
        raise ValueError("PINECONE_API_KEY not found in environment variables")
    embedding_dimension = 1536

    all_chunks = []
    total_files = 0
    
    for category, pdf_folder in pdf_folders.items():
        os.makedirs(pdf_folder, exist_ok=True)
        pdf_files = glob.glob(os.path.join(pdf_folder, "*.pdf"))
        if not pdf_files:
            logging.warning(f"No PDF files found in {pdf_folder} for category '{category}'")
            continue
        
        logging.info(f"Found {len(pdf_files)} {category} PDF files to process")
        total_files += len(pdf_files)
        
        for pdf_path in tqdm(pdf_files, desc=f"Processing {category} PDFs"):
            filename = os.path.basename(pdf_path)
            text = extract_text_from_pdf(pdf_path)
            if not text:
                logging.warning(f"No text extracted from {filename}")
                continue
            cleaned_text = clean_text(text)
            chunks = create_chunks(cleaned_text, filename, chunk_size, chunk_overlap, pdf_folder, category)
            all_chunks.extend(chunks)
            logging.info(f"Created {len(chunks)} chunks from {category}/{filename}")
    
    if not all_chunks:
        logging.error("No chunks created from any PDFs")
        return
        
    logging.info(f"Total chunks created: {len(all_chunks)} from {total_files} files")
    index = setup_pinecone_index(pc, index_name, embedding_dimension)
    upload_to_pinecone(index, all_chunks)
    logging.info("Upload complete!")
    
    if args.test_query:
        test_search(index, args.test_query, category_filter=args.category)

def test_search(index, query, top_k=5, category_filter=None):
    import openai
    import logging
    from pdf2pinecone.pinecone_utils import generate_embedding
    import re
    logging.info(f"Testing search with query: '{query}'" + (f" (category: {category_filter})" if category_filter else ""))
    query_embedding = generate_embedding(query)
    if query_embedding is None:
        logging.error("Failed to generate query embedding")
        print("Failed to generate query embedding.")
        return
    try:
        # Build filter for category if specified
        filter_dict = {"category": {"$eq": category_filter}} if category_filter else None
        
        results = index.query(
            vector=query_embedding,
            top_k=top_k,
            include_values=False,
            include_metadata=True,
            filter=filter_dict
        )
        
        category_text = f" in '{category_filter}' category" if category_filter else ""
        print(f"\nFound {len(results.matches)} results for: '{query}'{category_text}\n" + "="*60)
        
        for i, match in enumerate(results.matches):
            filename = match.metadata.get('filename', 'N/A')
            category = match.metadata.get('category', 'N/A')
            chunk_idx = match.metadata.get('chunk_index', 'N/A')
            score = match.score
            chunk_text = match.metadata.get('text', None)
            
            # Highlight query in chunk_text
            if chunk_text:
                snippet = chunk_text[:500] + ("..." if len(chunk_text) > 500 else "")
                # Highlight all occurrences of the query (case-insensitive)
                pattern = re.compile(re.escape(query), re.IGNORECASE)
                snippet = pattern.sub(lambda m: f"\033[1;31m{m.group(0)}\033[0m", snippet)
            else:
                snippet = "Content not found in metadata."
                
            print(f"Result {i+1} | Score: {score:.4f} | Category: {category.upper()}")
            print(f"File: {filename} | Chunk: {chunk_idx}")
            print(f"Snippet:\n{snippet}\n{'-'*60}")
            
        print(f"\nEnd of results. Displayed {len(results.matches)} out of {top_k} requested.\n")
    except Exception as e:
        logging.error(f"Error during search: {str(e)}")
        print(f"Error during search: {str(e)}")

if __name__ == "__main__":
    main()
