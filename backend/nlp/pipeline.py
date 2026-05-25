"""
NLP Pipeline for Sentiment Analysis
Uses VADER (rule-based) + optional trained ML model
Includes: text cleaning, tokenization, lemmatization, keyword extraction
"""
import re
import time
import string
from typing import List, Dict, Tuple

import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk.stem import WordNetLemmatizer
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

# Download required NLTK data
def download_nltk_data():
    resources = [
        "punkt", "stopwords", "wordnet", "averaged_perceptron_tagger",
        "punkt_tab", "omw-1.4"
    ]
    for r in resources:
        try:
            nltk.download(r, quiet=True)
        except Exception:
            pass

download_nltk_data()

# Positive / Negative keyword lexicons for highlighting
POSITIVE_WORDS = {
    "good", "great", "excellent", "amazing", "awesome", "fantastic", "wonderful",
    "love", "best", "perfect", "beautiful", "happy", "joy", "brilliant", "outstanding",
    "superb", "magnificent", "delightful", "pleasant", "positive", "recommend",
    "impressive", "exceptional", "marvelous", "terrific", "fabulous", "nice",
    "helpful", "useful", "quality", "reliable", "fast", "efficient", "easy",
    "comfortable", "enjoy", "satisfied", "pleased", "thankful", "grateful",
    "enjoyed", "loved", "liked", "appreciate", "worth", "valued"
}

NEGATIVE_WORDS = {
    "bad", "terrible", "awful", "horrible", "worst", "poor", "disgusting",
    "hate", "disappointed", "disappointing", "useless", "broken", "waste",
    "failure", "failed", "problem", "issue", "defective", "cheap", "slow",
    "ugly", "frustrating", "frustrated", "annoying", "annoyed", "angry",
    "upset", "unhappy", "sad", "regret", "refund", "return", "damaged",
    "fake", "scam", "misleading", "overpriced", "mediocre", "flimsy"
}


class SentimentPipeline:
    def __init__(self):
        self.vader = SentimentIntensityAnalyzer()
        self.lemmatizer = WordNetLemmatizer()
        self._stop_words = set(stopwords.words("english"))

    def clean_text(self, text: str) -> str:
        """Full text cleaning pipeline."""
        # Lowercase
        text = text.lower()
        # Remove URLs
        text = re.sub(r"http\S+|www\S+", "", text)
        # Remove HTML tags
        text = re.sub(r"<[^>]+>", "", text)
        # Remove special characters but keep spaces
        text = re.sub(r"[^a-z\s]", " ", text)
        # Collapse whitespace
        text = re.sub(r"\s+", " ", text).strip()
        return text

    def tokenize(self, text: str) -> List[str]:
        return word_tokenize(text)

    def remove_stopwords(self, tokens: List[str]) -> List[str]:
        return [t for t in tokens if t not in self._stop_words and len(t) > 2]

    def lemmatize(self, tokens: List[str]) -> List[str]:
        return [self.lemmatizer.lemmatize(t) for t in tokens]

    def preprocess(self, text: str) -> List[str]:
        cleaned = self.clean_text(text)
        tokens = self.tokenize(cleaned)
        tokens = self.remove_stopwords(tokens)
        tokens = self.lemmatize(tokens)
        return tokens

    def extract_keywords(self, text: str) -> List[Dict]:
        """Extract sentiment-influencing keywords with scores."""
        tokens = self.preprocess(text)
        keywords = []
        seen = set()
        for word in tokens:
            if word in seen:
                continue
            seen.add(word)
            score = self.vader.polarity_scores(word)["compound"]
            ktype = "neutral"
            if word in POSITIVE_WORDS or score > 0.1:
                ktype = "positive"
            elif word in NEGATIVE_WORDS or score < -0.1:
                ktype = "negative"
            else:
                continue  # skip purely neutral words from highlights
            keywords.append({"word": word, "score": round(score, 4), "type": ktype})

        # Sort by absolute score
        keywords.sort(key=lambda x: abs(x["score"]), reverse=True)
        return keywords[:15]

    def analyze(self, text: str, model: str = "vader") -> Dict:
        """Main analysis method. `model` param accepted for API compatibility (VADER only currently)."""
        start = time.time()

        # VADER analysis on raw text (works better with punctuation/caps)
        vader_scores = self.vader.polarity_scores(text)
        compound = vader_scores["compound"]

        pos = vader_scores["pos"]
        neg = vader_scores["neg"]
        neu = vader_scores["neu"]

        # Determine sentiment
        if compound >= 0.05:
            sentiment = "Positive"
            confidence = min(0.5 + compound * 0.5, 1.0)
        elif compound <= -0.05:
            sentiment = "Negative"
            confidence = min(0.5 + abs(compound) * 0.5, 1.0)
        else:
            sentiment = "Neutral"
            confidence = max(0.5, neu)

        keywords = self.extract_keywords(text)
        elapsed_ms = (time.time() - start) * 1000

        return {
            "text": text,
            "sentiment": sentiment,
            "confidence": round(confidence, 4),
            "model_used": model if model else "vader",
            "scores": {
                "positive": round(pos, 4),
                "negative": round(neg, 4),
                "neutral": round(neu, 4),
            },
            "compound_score": round(compound, 4),
            "keywords": keywords,
            "processing_time_ms": round(elapsed_ms, 2),
        }

    def analyze_batch(self, texts: List[str], model: str = "vader") -> List[Dict]:
        return [self.analyze(t, model=model) for t in texts]


# Singleton instance
_pipeline: SentimentPipeline = None


def get_pipeline() -> SentimentPipeline:
    global _pipeline
    if _pipeline is None:
        _pipeline = SentimentPipeline()
    return _pipeline
