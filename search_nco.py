import time
from elasticsearch import Elasticsearch
from sentence_transformers import SentenceTransformer
import csv

# Connect to Elasticsearch
es = Elasticsearch("http://localhost:9200")

# Load SBERT model
model = SentenceTransformer("paraphrase-multilingual-mpnet-base-v2")

def load_csv_to_dict(path):
    mapping = {}
    with open(path, encoding="utf-8") as f:
        reader = csv.reader(f)
        for row in reader:
            if len(row) >= 2:
                mapping[row[0].strip()] = row[1].strip()
    return mapping

division_map = load_csv_to_dict("dataset/division.csv")
subdivision_map = load_csv_to_dict("dataset/subdivision.csv")
group_map = load_csv_to_dict("dataset/group.csv")
family_map = load_csv_to_dict("dataset/family.csv")

def parse_hierarchy(nco2015_code):
    code = nco2015_code.split(".")[0]  # take only before dot, e.g. 8524
    division = code[0]
    subdivision = code[:2]
    group = code[:3]
    family = code[:4]

    return {
        "division": division_map.get(division, "Unknown"),
        "subdivision": subdivision_map.get(subdivision, "Unknown"),
        "group": group_map.get(group, "Unknown"),
        "family": family_map.get(family, "Unknown"),
    }

def semantic_search(query, k=5):
    """Perform semantic search with Elasticsearch + SBERT."""
    start_time = time.time()
    query_vector = model.encode(query).tolist()
    encode_time = time.time() - start_time

    sem_search = es.search(
        index="nco2015",
        knn={
            "field": "title_vector",
            "query_vector": query_vector,
            "k": k,
            "num_candidates": 50,
        }
    )

    results = []
    for hit in sem_search["hits"]["hits"]:
        title = hit["_source"]["Title"]
        code2015 = hit["_source"]["NCO2015_Code"]
        code2004 = hit["_source"]["NCO2004_Code"]
        score = hit["_score"]

        hierarchy = parse_hierarchy(code2015)

        results.append({
            "title": title,
            "NCO2015": code2015,
            "NCO2004": code2004,
            "confidence": round(score, 4),
            "hierarchy": hierarchy
        })

    return {
        "query": query,
        "embedding_time": round(encode_time, 3),
        "results": results
    }
