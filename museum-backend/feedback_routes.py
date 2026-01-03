import firebase_admin
from firebase_admin import credentials, firestore
from fastapi import APIRouter, HTTPException
import os

router = APIRouter(tags=["Feedback"])

# Initialize Firebase (Singleton pattern to avoid re-initialization error)
if not firebase_admin._apps:
    # Ensure the path to firebase_key.json is correct relative to where main.py runs
    # Typically in the same folder or specified via env
    key_path = "firebase_key.json" 
    if os.path.exists(key_path):
        cred = credentials.Certificate(key_path)
        firebase_admin.initialize_app(cred)
    else:
        print(f"Warning: {key_path} not found. Feedback routes will fail.")

def get_db():
    if not firebase_admin._apps:
        raise HTTPException(status_code=500, detail="Firebase not initialized")
    return firestore.client()

@router.get("/api/feedback/analysis")
def get_feedback_analysis():
    """
    Fetches actionable feedback insights from Firestore.
    """
    try:
        db = get_db()
        docs = db.collection("museum_feedback").stream()
        actionable_feedbacks = []
        
        for doc in docs:
            data = doc.to_dict()
            ai_analysis = data.get("ai_analysis")
            
            if ai_analysis and isinstance(ai_analysis, dict):
                 # We focus on actionable items as requested
                 if ai_analysis.get("actionable"):
                     item = {
                         "id": doc.id,
                         "text": data.get("feedback_text", ""),
                         "sentiment": ai_analysis.get("sentiment", "neutral"),
                         "category": ai_analysis.get("category", "general"),
                         "priority": (ai_analysis.get("priority") or "low").lower(),
                         "steps": ai_analysis.get("actionable_steps", [])
                     }
                     actionable_feedbacks.append(item)
        
        # Sort by priority: High > Medium > Low
        priority_map = {"high": 3, "medium": 2, "low": 1}
        actionable_feedbacks.sort(key=lambda x: priority_map.get(x["priority"], 0), reverse=True)
        
        return actionable_feedbacks
        
    except Exception as e:
        print(f"Error fetching feedback: {e}")
        # Allow returning empty list instead of crashing if DB is empty or misconfigured locally
        return []
