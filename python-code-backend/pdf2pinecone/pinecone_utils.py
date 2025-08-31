import os
import hashlib
from typing import List, Dict, Any
from pinecone import Pinecone, ServerlessSpec
import openai
import logging
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

def create_chunks(text: str, filename: str, chunk_size: int, chunk_overlap: int, pdf_folder: str, category: str) -> List[Dict[str, Any]]:
    words = text.split()
    chunks = []
    for i in range(0, len(words), chunk_size - chunk_overlap):
        chunk_words = words[i:i + chunk_size]
        chunk_text = ' '.join(chunk_words)
        chunk_id = hashlib.md5(f"{filename}_{i}_{chunk_text[:50]}".encode()).hexdigest()
        chunk_data = {
            'id': chunk_id,
            'text': chunk_text,
            'metadata': {
                'filename': filename,
                'category': category,
                'chunk_index': len(chunks),
                'word_count': len(chunk_words),
                'char_count': len(chunk_text),
                'source_path': os.path.join(pdf_folder, filename),
                'text': chunk_text
            }
        }
        chunks.append(chunk_data)
    return chunks

def generate_embedding(text: str) -> List[float]:
    try:
        response = openai.embeddings.create(
            input=text,
            model="text-embedding-ada-002"
        )
        return response.data[0].embedding
    except Exception as e:
        logging.error(f"Error generating embedding: {str(e)}")
        return None

def setup_pinecone_index(pc, index_name, embedding_dimension):
    try:
        if index_name not in pc.list_indexes().names():
            logging.info(f"Creating new Pinecone index: {index_name}")
            pc.create_index(
                name=index_name,
                dimension=embedding_dimension,
                metric='cosine',
                spec=ServerlessSpec(cloud='aws', region='us-east-1')
            )
            logging.info("Waiting for index to be ready...")
            time.sleep(10)
        else:
            logging.info(f"Using existing Pinecone index: {index_name}")
        return pc.Index(index_name)
    except Exception as e:
        logging.error(f"Error setting up Pinecone index: {str(e)}")
        raise

def upload_to_pinecone(index, chunks: List[Dict[str, Any]], batch_size: int = 100, parallel: bool = True):
    logging.info(f"Uploading {len(chunks)} chunks to Pinecone...")
    def embed_and_prepare(chunk):
        embedding = generate_embedding(chunk['text'])
        if embedding is None:
            logging.warning(f"Skipping chunk {chunk['id']} due to embedding error")
            return None
        return {
            'id': chunk['id'],
            'values': embedding,
            'metadata': chunk['metadata']
        }
    vectors_to_upsert = []
    if parallel:
        with ThreadPoolExecutor() as executor:
            future_to_chunk = {executor.submit(embed_and_prepare, chunk): chunk for chunk in chunks}
            for future in as_completed(future_to_chunk):
                result = future.result()
                if result:
                    vectors_to_upsert.append(result)
    else:
        for chunk in chunks:
            result = embed_and_prepare(chunk)
            if result:
                vectors_to_upsert.append(result)
    for i in range(0, len(vectors_to_upsert), batch_size):
        batch = vectors_to_upsert[i:i + batch_size]
        try:
            index.upsert(vectors=batch)
            logging.info(f"Uploaded batch {i//batch_size + 1}/{(len(vectors_to_upsert) + batch_size - 1)//batch_size}")
            time.sleep(1)
        except Exception as e:
            logging.error(f"Error uploading batch to Pinecone: {str(e)}")
