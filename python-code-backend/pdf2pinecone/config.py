import os
from dotenv import load_dotenv

def load_config():
    load_dotenv()
    return {
        'OPENAI_API_KEY': os.getenv('OPENAI_API_KEY'),
        'PINECONE_API_KEY': os.getenv('PINECONE_API_KEY'),
        'PINECONE_ENVIRONMENT': os.getenv('PINECONE_ENVIRONMENT'),
        'PDF_FOLDERS': {
            'incident': os.getenv('INCIDENT_FOLDER', './pdfs/incident'),
            'accident': os.getenv('ACCIDENT_FOLDER', './pdfs/accident')
        },
        'INDEX_NAME': os.getenv('INDEX_NAME', 'dgca-reports'),
        'CHUNK_SIZE': int(os.getenv('CHUNK_SIZE', 500)),
        'CHUNK_OVERLAP': int(os.getenv('CHUNK_OVERLAP', 50)),
    }
