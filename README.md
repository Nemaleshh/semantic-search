# AI-Enabled Semantic Search for National Classification of Occupations (NCO-2015)

## To develop an AI-powered semantic search system for the National Classification of Occupations (NCO-2015) that helps users find relevant occupation codes using free-text queries instead of relying on keyword-based static PDFs.

## PROBLEM WITH TRADITIONAL METHOD

Only keyword-based search in static PDF documents.

Requires exact match → "Sewing Machine Operator" won’t be found if you search "Tailor."

Users need to know the hierarchical classification (division → sub-group → family → occupation).

Time-consuming, error-prone, and not scalable.

## WHAT IS SEMANTIC SEARCH?

Semantic search goes beyond keywords.

Uses Natural Language Processing (NLP) embeddings to understand the meaning of words.

Example:
```
Query: "Tailor in garment factory"

Match: "Sewing Machine Operator (Code: 8153.0100)" with high confidence.
```
## FEATURES

1.Ingests and indexes NCO-2015 occupation data (from PDF → CSV).

2.Semantic search with embeddings + Elasticsearch.

3.Returns top N matches with confidence scores.

4.Synonym & related term support.

5.Multilingual queries (English, Hindi, regional languages).

6.User-friendly interface (search bar, results, hierarchy view).

7.Admin panel for updating datasets.

8.API-ready for integration with MoSPI survey tools.

## BENEFITS OVER TRADITIONAL METHOD

✅ Faster and more accurate occupation code identification

✅ Works with natural language (no need for exact keywords)

✅ Handles synonyms & regional language queries

✅ Reduces training effort for enumerators

✅ Improves data quality & consistency in national surveys

## FLOW DIAGRAM (Model Output)
```
User Query → Text Normalization → Embeddings → Elasticsearch/FAISS Index → 
Ranked Occupation Matches → Confidence Scores → UI/API Output
```
## IMPACT

### Efficiency: Saves time for enumerators in large-scale surveys.

### Accuracy: Reduces misclassification errors.

### Scalability: Works across 3,600+ occupations and 52 sectors.

### Policy Support: Enables high-quality official statistics for evidence-based governance.

## ALGORITHM

Start the application.

Extract NCO-2015 data from PDFs → Convert to CSV.

Preprocess text (normalization, cleaning).

Generate embeddings using NLP models (e.g., BERT, Sentence Transformers).

Index data in Elasticsearch (BM25 + vector similarity).

Accept user query (text/voice, multilingual).

Retrieve top N results ranked by semantic relevance.

Return occupation codes, names, and confidence scores.

Log query and allow manual override.

Stop the program.

## IMPLEMENTATION STEPS
### 🔹 1. Start Elasticsearch

Open Command Prompt and navigate to Elasticsearch folder:
```
cd C:\Users\<your-username>\elasticsearch-9.1.2\bin
.\elasticsearch
```

### Elasticsearch will start at: http://localhost:9200

## 🔹 2. Backend Setup

Navigate to project folder and activate virtual environment:
```
cd D:\stathon   # your project folder
venv\Scripts\activate
python app.py
```
### 🔹 3. Frontend Setup

Open another terminal and run:
```
cd npo
npm install
npm run dev
```

Your frontend will be available at:
👉 http://localhost:3000

## SAMPLE USAGE

Input Query: "tailor stitching clothes in garment factory"
Output:

1. Sewing Machine Operator (8153.0100) – Confidence: 0.92
2. Garment Finisher (8153.0200) – Confidence: 0.78
3. Hand Embroiderer (7318.0100) – Confidence: 0.65


## Additional EXTENSIONS



Voice input integration

Full Hindi & regional language support

Mobile app integration for field enumerators

Continuous learning with user feedback

## Model Output
### Landing page
<img width="1919" height="1077" alt="Screenshot 2025-08-20 235318" src="https://github.com/user-attachments/assets/0e4303d9-1a33-40dc-88de-67f053d9b900" />


### Admin Pannel

<img width="1916" height="1078" alt="Screenshot 2025-08-20 235249" src="https://github.com/user-attachments/assets/b3553e55-67b6-46b7-8216-c53b05bf4acc" />


### Data Entry Pannel

<img width="1917" height="1079" alt="Screenshot 2025-08-20 235259" src="https://github.com/user-attachments/assets/33b1a389-6385-44cd-bca6-4157fae639a2" />
