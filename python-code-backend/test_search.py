#!/usr/bin/env python3
"""
Test script for PDF2Pinecone search functionality.
This script allows you to test different search queries without re-running the main pipeline.
"""

import os
import sys
import re
import logging
from pathlib import Path

# Add the current directory to Python path to import pdf2pinecone
sys.path.insert(0, str(Path(__file__).parent))

from pdf2pinecone.config import load_config
from pdf2pinecone.pinecone_utils import generate_embedding, setup_pinecone_index
from pinecone import Pinecone

# Setup logging
logging.basicConfig(level=logging.INFO)


def perform_search(query: str, category: str = None, top_k: int = 5):
    """
    Perform search functionality with a given query.
    
    Args:
        query: Search query string
        category: Optional category filter ('incident' or 'accident')
        top_k: Number of results to return (default: 5)
    """
    print(f"\n{'='*60}")
    print(f"🔍 Testing Search Query: '{query}'")
    if category:
        print(f"📁 Category Filter: {category.upper()}")
    print(f"📊 Top Results: {top_k}")
    print(f"{'='*60}\n")
    
    try:
        # Load config and setup Pinecone
        config = load_config()
        pc = Pinecone(api_key=config['PINECONE_API_KEY'])
        
        # Get existing index
        index_name = config['INDEX_NAME']
        if index_name not in [index.name for index in pc.list_indexes()]:
            print(f"❌ Index '{index_name}' not found! Please run the main pipeline first.")
            return
        
        index = pc.Index(index_name)
        
        # Generate query embedding
        logging.info(f"Generating embedding for query: '{query}'")
        query_embedding = generate_embedding(query)
        if query_embedding is None:
            print("❌ Failed to generate query embedding.")
            return
        
        # Build filter for category if specified
        filter_dict = {"category": {"$eq": category}} if category else None
        
        # Perform search
        results = index.query(
            vector=query_embedding,
            top_k=top_k,
            include_values=False,
            include_metadata=True,
            filter=filter_dict
        )
        
        if not results.matches:
            print("❌ No results found!")
            return
        
        # Display results
        category_text = f" in '{category}' category" if category else ""
        print(f"✅ Found {len(results.matches)} results for: '{query}'{category_text}\n")
        
        for i, match in enumerate(results.matches):
            filename = match.metadata.get('filename', 'N/A')
            category_meta = match.metadata.get('category', 'N/A')
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
                
            print(f"📄 Result {i+1} | Score: {score:.4f} | Category: {category_meta.upper()}")
            print(f"📁 File: {filename} | � Chunk: {chunk_idx}")
            print(f"📝 Content:\n{snippet}\n{'-'*60}")
            
        print(f"\n✅ Search completed! Displayed {len(results.matches)} results.\n")
        
    except Exception as e:
        print(f"❌ Error during search: {str(e)}")
        import traceback
        traceback.print_exc()


def run_predefined_tests():
    """Run a set of predefined test queries."""
    
    print("🧪 Running Predefined Test Suite...")
    
    test_cases = [
        # General aviation safety tests
        {"query": "engine failure", "category": None, "top_k": 3},
        {"query": "hard landing", "category": "incident", "top_k": 3},
        {"query": "emergency descent", "category": None, "top_k": 3},
        
        # Specific airline tests
        {"query": "indigo aircraft", "category": None, "top_k": 5},
        {"query": "spicejet", "category": None, "top_k": 3},
        
        # Technical issues
        {"query": "fuel emergency", "category": None, "top_k": 3},
        {"query": "runway excursion", "category": None, "top_k": 3},
        
        # Category-specific tests
        {"query": "collision", "category": "accident", "top_k": 3},
        {"query": "smoke cabin", "category": "incident", "top_k": 3},
    ]
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n🧪 Test Case {i}/{len(test_cases)}")
        perform_search(**test_case)
        
        # Pause between tests for readability
        if i < len(test_cases):
            input("\nPress Enter to continue to next test...")


def interactive_mode():
    """Interactive mode for custom queries."""
    
    print("\n🎯 Interactive Search Mode")
    print("Type your search queries below. Type 'quit' to exit, 'tests' to run predefined tests.")
    print("Format: <query> [--category incident|accident] [--top-k N]")
    print("Example: engine failure --category incident --top-k 10")
    print("-" * 60)
    
    while True:
        try:
            user_input = input("\n🔍 Enter search query: ").strip()
            
            if user_input.lower() in ['quit', 'exit', 'q']:
                print("👋 Goodbye!")
                break
            
            if user_input.lower() in ['tests', 'test']:
                run_predefined_tests()
                continue
            
            if not user_input:
                print("❌ Please enter a search query.")
                continue
            
            # Parse command-line style arguments
            parts = user_input.split()
            query_parts = []
            category = None
            top_k = 5
            
            i = 0
            while i < len(parts):
                if parts[i] == '--category' and i + 1 < len(parts):
                    category = parts[i + 1].lower()
                    if category not in ['incident', 'accident']:
                        print(f"❌ Invalid category: {category}. Use 'incident' or 'accident'.")
                        break
                    i += 2
                elif parts[i] == '--top-k' and i + 1 < len(parts):
                    try:
                        top_k = int(parts[i + 1])
                        if top_k <= 0:
                            raise ValueError("top_k must be positive")
                    except ValueError:
                        print(f"❌ Invalid top-k value: {parts[i + 1]}. Must be a positive integer.")
                        break
                    i += 2
                else:
                    query_parts.append(parts[i])
                    i += 1
            else:
                # Only execute if we didn't break out of the loop
                query = ' '.join(query_parts)
                if query:
                    perform_search(query, category, top_k)
                else:
                    print("❌ No search query provided.")
        
        except KeyboardInterrupt:
            print("\n👋 Goodbye!")
            break
        except Exception as e:
            print(f"❌ Error: {str(e)}")


def main():
    """Main function to handle command line arguments or interactive mode."""
    
    print("🧪 PDF2Pinecone Search Test Tool")
    print("=" * 40)
    
    if len(sys.argv) > 1:
        # Command line mode
        query = ' '.join(sys.argv[1:])
        perform_search(query)
    else:
        # Interactive mode
        print("\nChoose an option:")
        print("1. Interactive search mode")
        print("2. Run predefined test suite")
        print("3. Quick test with 'engine failure'")
        
        choice = input("\nEnter choice (1-3): ").strip()
        
        if choice == '1':
            interactive_mode()
        elif choice == '2':
            run_predefined_tests()
        elif choice == '3':
            perform_search("engine failure", top_k=5)
        else:
            print("❌ Invalid choice. Starting interactive mode...")
            interactive_mode()


if __name__ == "__main__":
    main()


