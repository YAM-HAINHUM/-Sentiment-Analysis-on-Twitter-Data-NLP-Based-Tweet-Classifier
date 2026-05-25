"""
ML Model Training Script for Sentiment Analysis
Trains Logistic Regression, Naive Bayes, SVM with TF-IDF + GridSearchCV
Saves best pipeline to backend/nlp/saved_models/
"""
import os
import joblib
import pandas as pd
import numpy as np
from typing import Dict, Any
from pathlib import Path
from sklearn.model_selection import train_test_split, GridSearchCV, StratifiedKFold
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.naive_bayes import MultinomialNB
from sklearn.svm import SVC
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report, accuracy_score, f1_score
from sklearn.compose import ColumnTransformer
from imblearn.over_sampling import SMOTE
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
import re

# Mock Twitter dataset (positive/negative/neutral balanced)
MOCK_DATA = [
    # Positive (200 samples summarized)
    ("Love this product! Best purchase ever.", "Positive"),
    ("Absolutely amazing service!", "Positive"),
    ("Highly recommend to everyone!", "Positive"),
    # ... (in real: load from CSV)
] * 67  # ~200 pos
MOCK_DATA += [
    ("Terrible quality, broke immediately.", "Negative"),
    ("Worst experience ever, avoid!", "Negative"),
    ("Complete waste of money.", "Negative"),
] * 67  # ~200 neg
MOCK_DATA += [
    ("It's okay, nothing special.", "Neutral"),
    ("Average product, does the job.", "Neutral"),
    ("Standard quality, expected.", "Neutral"),
] * 67  # ~200 neu

for i in range(200):  # Extend to 800+ samples
    MOCK_DATA.extend([
        (f"Great product {i} works perfectly!", "Positive"),
        (f"Awful service {i} very disappointed.", "Negative"),
        (f"OK experience {i}.", "Neutral"),
    ])

df = pd.DataFrame(MOCK_DATA, columns=['text', 'sentiment'])
df['sentiment'] = df['sentiment'].map({'Positive': 2, 'Neutral': 1, 'Negative': 0})

print(f"Dataset: {len(df)} samples, Distribution:\n{df['sentiment'].value_counts()}")

def preprocess_text(text: str) -> str:
    lemmatizer = WordNetLemmatizer()
    stop_words = set(stopwords.words('english'))
    
    text = text.lower()
    text = re.sub(r'[^a-z\s]', ' ', text)
    tokens = text.split()
    tokens = [lemmatizer.lemmatize(t) for t in tokens if t not in stop_words and len(t) > 2]
    return ' '.join(tokens)

df['processed_text'] = df['text'].apply(preprocess_text)
X = df['processed_text']
y = df['sentiment']

# Split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

print("\n🚀 Training Pipelines...")

models = {
    'LogisticRegression': {
        'model': LogisticRegression(max_iter=1000, random_state=42),
        'params': {
            'clf__C': [0.1, 1, 10],
            'clf__penalty': ['l2']
        }
    },
    'NaiveBayes': {
        'model': MultinomialNB(),
        'params': {'clf__alpha': [0.1, 0.5, 1.0]}
    },
    'SVM': {
        'model': SVC(kernel='linear', probability=True, random_state=42),
        'params': {
            'clf__C': [0.1, 1, 10],
            'clf__gamma': ['scale']
        }
    }
}

best_model_name = None
best_model = None
best_score = 0

os.makedirs('backend/nlp/saved_models', exist_ok=True)

for name, config in models.items():
    print(f"\n--- Training {name} ---")
    
    pipeline = Pipeline([
        ('tfidf', TfidfVectorizer(max_features=5000, ngram_range=(1,2), stop_words='english')),
        ('smote', SMOTE(random_state=42)),  # Handle imbalance
        ('clf', config['model'])
    ])
    
    # Only if params exist
    if config['params']:
        grid_search = GridSearchCV(pipeline, config['params'], cv=StratifiedKFold(n_splits=5), scoring='f1_weighted', n_jobs=-1)
        grid_search.fit(X_train, y_train)
        model = grid_search.best_estimator_
        print(f"Best params: {grid_search.best_params_}")
    else:
        pipeline.fit(X_train, y_train)
        model = pipeline
    
    # Evaluate
    y_pred = model.predict(X_test)
    score = f1_score(y_test, y_pred, average='weighted')
    print(f"F1 Score: {score:.4f}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=['Negative', 'Neutral', 'Positive']))
    
    if score > best_score:
        best_score = score
        best_model = model
        best_model_name = name
    
    # Save
    joblib.dump(model, f"backend/nlp/saved_models/{name.lower()}_pipeline.joblib")

# Save best
if best_model:
    joblib.dump(best_model, "backend/nlp/saved_models/best_pipeline.joblib")
    print(f"\n🎉 Best model: {best_model_name} (F1: {best_score:.4f}) saved!")

print("\n✅ Training complete! Run this once, then restart backend.")

