import os
from pydantic import BaseModel, Field
from datetime import datetime
import firebase_admin
from firebase_admin import firestore, credentials, initialize_app
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from typing import Optional
from analyze_feedback import analyze_feedback

router = APIRouter(tags=["Feedback"])

def get_db():
    if not firebase_admin._apps:
        cred_path = "firebase_key.json"
        
        # Check if we are running from root or museum-backend
        if not os.path.exists(cred_path):
             # Try going into museum-backend if current dir is root
             if os.path.exists(os.path.join("museum-backend", cred_path)):
                 cred_path = os.path.join("museum-backend", cred_path)
             else:
                 # Fallback/Error if not found
                 raise HTTPException(status_code=500, detail="Firebase credentials file (firebase_key.json) not found.")

        cred = credentials.Certificate(cred_path)
        initialize_app(cred)
        
    return firestore.client()

class FeedbackCreate(BaseModel):
    visitor_id: str
    feedback_text: str
    rating: int = Field(..., ge=1, le=5)

def process_feedback_background(doc_id: str, text: str):
    """
    Background task to analyze feedback using Gemini and update Firestore.
    """
    try:
        print(f"Starting background analysis for feedback {doc_id}...")
        analysis = analyze_feedback(text)
        db = get_db()
        db.collection("visitor_feedback").document(doc_id).update({
            "ai_analysis": analysis,
            "processed": True
        })
        print(f"Background analysis completed for {doc_id}: {analysis}")
    except Exception as e:
        print(f"Error in background analysis for {doc_id}: {e}")

@router.post("/api/feedback", status_code=201)
def submit_feedback(feedback: FeedbackCreate, background_tasks: BackgroundTasks):
    try:
        db = get_db()
        # Add a new document with auto-generated ID
        new_feedback = {
            "visitor_id": feedback.visitor_id,
            "feedback_text": feedback.feedback_text,
            "rating": feedback.rating,
            "timestamp": datetime.utcnow(),
            "processed": False  # Flag for AI analysis script
        }
        update_time, doc_ref = db.collection("visitor_feedback").add(new_feedback)
        
        # Trigger background analysis immediately
        background_tasks.add_task(process_feedback_background, doc_ref.id, feedback.feedback_text)
        
        return {"message": "Feedback submitted successfully"}
    except Exception as e:
        print(f"Error submitting feedback: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/feedback/analysis")
def get_feedback_analysis():
    """
    Fetches actionable feedback insights from Firestore.
    """
    try:
        db = get_db()
        docs = db.collection("visitor_feedback").stream()
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
        return []
