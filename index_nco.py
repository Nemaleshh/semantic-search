import csv
import time
from elasticsearch import Elasticsearch, helpers
from sentence_transformers import SentenceTransformer

def indexing(dataset_path="dataset/nco2015_full.csv", index_name="nco2015"):
    """
    Re-index the given dataset into Elasticsearch.
    """
    # Connect to Elasticsearch
    es = Elasticsearch("http://localhost:9200")

    # Load SBERT model
    model = SentenceTransformer("paraphrase-multilingual-mpnet-base-v2")
    embedding_dim = model.get_sentence_embedding_dimension()

    # Load CSV
    all_rows = []
    with open(dataset_path, encoding="utf8") as fIn:
        reader = csv.DictReader(fIn)
        for row in reader:
            all_rows.append({
                "NCO2015_Code": row["NCO2015_Code"],
                "Title": row["Title"],
                "NCO2004_Code": row.get("NCO2004_Code", "")
            })

    # Re-create index (drop old one)
    if es.indices.exists(index=index_name):
        es.indices.delete(index=index_name)
        print(f"Deleted old index: {index_name}")

    es_index = {
        "mappings": {
            "properties": {
                "NCO2015_Code": {"type": "keyword"},
                "Title": {"type": "text"},
                "NCO2004_Code": {"type": "keyword"},
                "title_vector": {
                    "type": "dense_vector",
                    "dims": embedding_dim,
                    "index": True,
                    "similarity": "cosine"
                },
            }
        }
    }
    es.indices.create(index=index_name, body=es_index)
    print(f"Created index: {index_name}")

    # Encode and bulk insert
    print("Indexing NCO data...")

    chunk_size = 200
    for start_idx in range(0, len(all_rows), chunk_size):
        end_idx = start_idx + chunk_size
        subset = all_rows[start_idx:end_idx]

        # Encode titles in batch
        embeddings = model.encode([r["Title"] for r in subset], show_progress_bar=False)

        bulk_data = []
        for r, emb in zip(subset, embeddings):
            bulk_data.append({
                "_index": index_name,
                "_id": r["NCO2015_Code"],
                "_source": {
                    "NCO2015_Code": r["NCO2015_Code"],
                    "Title": r["Title"],
                    "NCO2004_Code": r["NCO2004_Code"],
                    "title_vector": emb.tolist()
                }
            })
        helpers.bulk(es, bulk_data)

    print("✅ Indexing complete.")

if __name__ == "__main__":
    indexing()
