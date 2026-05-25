# 🧠 AI Sentiment Analysis Dashboard (AI Insights Panel)

> **Project Title:** AI Sentiment Analysis Dashboard (Without Chatbot – AI Insights Based)

---

## 1) 📌 Project Overview

### 📝 Description
The **AI Sentiment Analysis Dashboard** is a web application that analyzes sentiment from user-provided text (single input, batch input, or CSV upload) and stores results in **MongoDB**. Instead of conversational AI, the system focuses on a dedicated **AI Insights Panel** that generates **auto-generated, decision-oriented insights** based on the user’s recent sentiment history.

### ❗ Problem Statement
Interpreting large amounts of text feedback manually is slow and inconsistent. A typical dashboard might show charts, but it often fails to answer key questions:
- What does the sentiment trend actually *mean*? 🤔
- Which topics are driving negative sentiment? 🔎
- Are there spikes/anomalies that need attention? 🚨
- What is likely to happen next (predictive trend)? 📈

### ✅ Solution Approach
This project combines:
- **NLP sentiment scoring** using **VADER** and lightweight preprocessing ✅
- **Emotion detection** using lexicon/pattern heuristics 😄
- **Trend analysis** using time aggregation from stored history 📊
- **Spike detection** using baseline + deviation thresholds 🚨
- **Predictive analytics** using a lightweight forecasting approach 🔮
- **AI Insights Panel** that converts computed analytics into a clean executive summary & recommendations 🧠

---

## 2) 🎯 Objectives

- Enable sentiment analysis for:
  - ✍️ Single text input
  - 🧾 Batch input
  - 📄 CSV file uploads
- Provide **confidence**, **score breakdown** (Positive/Negative/Neutral), and **compound sentiment** scores.
- Store analysis results in **MongoDB** to support:
  - history browsing
  - drill-down exploration
  - analytics and insights generation
- Implement a dedicated **AI Insights Panel** that:
  - automatically generates summaries
  - highlights recurring negative topics
  - produces structured recommendations
- Provide advanced analytics:
  - 📈 trend analysis
  - 🚨 spike/anomaly detection
  - 🔮 predictive analytics
  - 🧠 emotion distribution

---

## 3) 🧰 Tech Stack

### 🌐 Frontend
- **React.js**
- **TypeScript** (project codebase)
- Charts: **Recharts**

### 🖥️ Backend
- **Python**
- **FastAPI**
- Async DB operations using **Motor**
- JWT-based authentication for protected endpoints

### 🗄️ Database
- **MongoDB**

### 🤖 AI / NLP
- **NLTK**
  - tokenization
  - stopwords removal
  - lemmatization
- **VADER Sentiment** (rule-based sentiment scoring)
- Keyword extraction based on sentiment-influencing lexicons
- AI Insights Panel generation using deterministic NLP heuristics/templates

---

## 4) ✨ Features

### ✅ Core Features

- **Sentiment analysis (single input)**
  - Returns:
    - sentiment label (Positive/Negative/Neutral)
    - confidence score
    - compound score
    - Positive/Negative/Neutral score breakdown
    - keyword influencers

- **Batch text analysis**
  - Accepts multiple lines (one text per line)
  - Returns per-text results and summary counts

- **CSV upload analysis** 📄
  - Upload a CSV file
  - Auto-detects the text column (or uses the selected column)
  - Analyzes up to a configured max rows for performance

- **History & analytics storage** 🗃️
  - Each analysis result is saved into MongoDB for later drill-down and reporting

- **Export** 📤
  - CSV export of sentiment history
  - PDF export for a professional analytics report

---

### 🔥 Advanced Features

#### 🧠 AI Insights Panel (No Chatbot)
The **AI Insights Panel** is the heart of the project.

It automatically generates:
- **Executive summary** of recent sentiment
- **Key insights** extracted from stored history
- **Recommendations** (especially around negative-topic drivers)
- **Emotion snapshot** (happy/sad/angry/excited distribution)

✅ The AI Insights Panel is generated from:
- stored MongoDB history
- computed keyword recurrence
- sentiment distribution

No chatbot is used for generating these insights.

---

#### 😄 Emotion Detection
Emotion detection is implemented using:
- lexicon keyword matches
- lightweight pattern detection

Emotions supported:
- **happy**
- **sad**
- **angry**
- **excited**

The system returns:
- emotion distribution over a chosen time window
- limited per-item emotion labels for UI rendering

---

#### 📈 Trend Analysis
Trend analysis uses aggregated history data:
- sentiment counts grouped by day
- keyword trend datasets for positive and negative sentiment
- drill-down by date (fetches stored tweets/items)

---

#### 🚨 Spike Detection
Spike detection identifies abnormal negative surges using:
- rolling baseline mean
- rolling baseline standard deviation
- deviation thresholding

Detected spikes are surfaced to the UI as alerts in the Trends page.

---

#### 🔮 Predictive Analytics
Predictive analytics forecasts near-future sentiment behavior using a lightweight forecasting approach:
- linear regression heuristic over recent daily negative values
- prediction overlay rendered on the chart

---

## 5) 🏗️ System Architecture

### End-to-End Flow (Frontend → Backend → NLP → DB → UI)

1. **Frontend (React UI)** 🎛️
   - User submits text / batch / CSV
   - User opens Analytics pages (AI Insights Panel, Trends, Emotions, History)

2. **Backend (FastAPI routes)** 🔌
   - Receives request payload
   - Calls the NLP pipeline

3. **NLP / Sentiment Engine** 🧠
   - Text cleaning
   - Tokenization + stopword removal
   - Lemmatization
   - **VADER compound scoring**
   - Sentiment classification
   - Keyword extraction

4. **Database Storage (MongoDB)** 🗃️
   - Save analysis result into `history`
   - Stored fields power analytics and insights

5. **AI Insights Panel Generation** 📊
   - Reads recent history from MongoDB
   - Computes sentiment distribution
   - Extracts recurring negative keywords
   - Produces executive summary and recommendations

6. **Frontend Rendering** 🧩
   - AI Insights Panel shows summary/recommendations
   - Trends page displays charts, spikes, and prediction overlay
   - Emotions page displays emotion distribution

---

## 6) 🧩 Modules Description

### 🖥️ Dashboard
- Overview of sentiment and quick metrics
- Summary KPIs (distribution, confidence trends, model usage)

### 📝 Analyze Page
- Single text analysis ✍️
- Batch analysis 🧾
- CSV upload 📄
- Visual sentiment score breakdown and keyword influencers

### 🧠 AI Insights Panel
- Executive summary (automatically generated)
- Key insights list
- Recommendations
- Emotion snapshot
- Refresh button for re-computing insights for a chosen time range

### 📊 Trends Page (Advanced Analytics)
Advanced analytics beyond basic graphs:
- time-series comparison
- moving average smoothing
- spike/anomaly alerts 🚨
- predictive analytics overlay 🔮
- trending keyword insights (positive & negative)
- drill-down drawer for detailed items by date

### 🗂️ History Page
- Search and filter stored analyses
- Pagination for performance
- View stored sentiment results

---

## 7) 🌐 API Endpoints

> Authentication: protected endpoints use JWT. Token is sent via `Authorization: Bearer <token>`.

### ✅ Analysis Endpoints
- **POST `/analyze`**
  - Analyze a single text input

- **POST `/analyze/batch`**
  - Analyze multiple texts

- **POST `/analyze/batch/csv`**
  - Upload CSV and analyze text column

- **POST `/analyze/public`**
  - Public endpoint (no auth, no saving to history)

### 🧠 AI Insights Panel Endpoints
- **GET `/insights`**
  - Returns AI Insights Panel summary + computed distributions + insights

### 📊 Trends / Drill-down Analytics
- **GET `/history/tweets-by-date`**
  - Drill-down items by a specific `YYYY-MM-DD`

- **GET `/history/keywords-trend`**
  - Per-day trending keywords for Positive and Negative sentiment

### 😄 Emotion Detection
- **GET `/emotions`**
  - Returns emotion distribution and per-item emotion labels

---

## 8) 🗃️ Database Schema

MongoDB stores records primarily in the **`history`** collection.

### 📌 History Document (Expected Fields)
- **`user_id`**: string
- **`user_email`**: string
- **`text`**: string (trimmed to a safe storage size)
- **`sentiment`**: `"Positive" | "Negative" | "Neutral"`
- **`confidence`**: float (0–1)
- **`scores`**:
  - `positive`: float
  - `negative`: float
  - `neutral`: float
- **`compound_score`**: float
- **`model_used`**: string (e.g., `vader`, `best`, `lr`, `nb`, `svm`)
- **`keywords`**: list of keyword objects
  - `word`: string
  - `score`: float
  - `type`: `"positive" | "negative" | "neutral"`
- **`created_at`**: datetime timestamp

---

## 9) 🛠️ Installation & Setup

### ✅ Backend Setup
```bash
cd backend
python -m venv .venv
.
.\venv\Scripts\activate
pip install -r requirements.txt
```

Run the backend server:
```bash
uvicorn app:app --reload --port 8000
```

### ✅ Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Open the app in your browser:
- http://localhost:5173 (default)

---

## 10) 📖 Usage Guide

1. **Open the app** 🌐
2. **Login / Register** 🔐
3. Go to **Analyze** page ✍️
4. Choose input mode:
   - Single Text
   - Batch Text
   - CSV Upload
5. Submit input to generate sentiment results 📊
6. View **AI Insights Panel** 🧠 for executive summaries and recommendations
7. Explore **Trends** 🚨 for time-series, spike detection, and prediction overlays
8. Use **History** 🗂️ to search and filter stored sentiment analyses
9. Export results via CSV / PDF 📤

---

## 11) 📑 Output / Results

### ✅ Sentiment Analysis Output
- `sentiment`: Positive / Negative / Neutral
- `confidence`: numeric score
- `compound_score`: VADER compound
- `scores`: positive/negative/neutral breakdown
- `keywords`: top influential keyword list
- `processing_time_ms`: runtime

### 🧠 AI Insights Panel Output
- `summary`: executive summary string
- `sentiment_distribution`: Positive/Negative/Neutral percentages
- `top_negative_keywords`: recurring negative topics
- UI-ready structured insights and recommendations

### 📈 Trends Output
- Daily sentiment series
- Moving average line (smoothing)
- Spike markers (anomalies)
- Prediction overlay (near-future forecast)

### 😄 Emotion Output
- Emotion distribution percentages
- Per-item emotion labels (limited for UI)

---

## 12) ⚠️ Challenges Faced

### API / Performance
- Analytics endpoints scan recent history; large datasets may increase response time.
- CSV analysis is intentionally capped (for usability and backend stability).

### Integration Issues
- Frontend and backend must align on response shapes and query params.
- Proper CORS configuration is required for smooth local development.

---

## 13) 🔮 Future Enhancements

- ⚡ Real-time dashboards using WebSockets or SSE
- 🧠 Integrate stronger transformer-based sentiment models
- 🧩 Improve AI Insights with richer NLP extraction
- 📌 Upgrade emotion detection with pretrained emotion classifiers
- 🔮 Add more forecasting models (ARIMA/Prophet)
- 🚨 Enhance spike detection with severity ranking and explanations

---

## 14) 🎓 Conclusion

The **AI Sentiment Analysis Dashboard** provides a complete workflow—from NLP-based sentiment scoring to advanced analytics and a dedicated **AI Insights Panel**. It transforms raw text data into structured dashboards with executive-level insight summaries, enabling users to understand sentiment patterns, detect anomalies, and make data-driven decisions.

