import os
import json
from dotenv import load_dotenv
from google import genai
from google.genai import types
import firebase_admin
from firebase_admin import credentials, firestore

# Load environment variables
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Initialize Firebase
if not firebase_admin._apps:
    cred = credentials.Certificate("firebase_key.json")
    firebase_admin.initialize_app(cred)

db = firestore.client()

# --- PROMPT DEFINITION ---
PROMPT_TEMPLATE = """
{
  "Role": "You are an expert AI system specializing in analyzing museum visitor feedback to improve operations and visitor experience.",
  "Direction": "Analyze the provided visitor feedback text and extract key insights. You must categorize the feedback, determine the sentiment, and identify if it is actionable. If actionable, provide specific steps.",
  "Domain": "Museum Management and Visitor Experience Analysis",
  "Output Format": "Return the result as a strict JSON object. Do not include markdown formatting like ```json ... ```.",
  "Few Shot Examples": [
    {
      "Input": "The audio guide was hard to hear in the main hall.",
      "Output": {
        "sentiment": "negative",
        "category": "audio",
        "actionable": true,
        "priority": "medium",
        "actionable_steps": ["Check volume levels in main hall units", "Inspect headphones for damage", "Consider noise cancelling options"]
      }
    },
    {
      "Input": "I loved the dinosaur exhibit! It was amazing.",
      "Output": {
        "sentiment": "positive",
        "category": "content",
        "actionable": false,
        "priority": null,
        "actionable_steps": null
      }
    },
    {
      "Input": "The staff at the entrance were rude.",
      "Output": {
        "sentiment": "negative",
        "category": "staff",
        "actionable": true,
        "priority": "high",
        "actionable_steps": ["Review staff training protocols", "Identify shift schedule", "Conduct customer service workshop"]
      }
    }
  ]
}

INPUT_FEEDBACK:
"{feedback_text}"
"""

def analyze_feedback(feedback_text):
    client = genai.Client(api_key=GEMINI_API_KEY)
    
    # Construct prompt
    prompt = PROMPT_TEMPLATE.replace("{feedback_text}", feedback_text)
    
    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            )
        )
        
        # Parse JSON response
        return json.loads(response.text)
        
    except Exception as e:
        print(f"Error analyzing feedback: {e}")
        return {
            "sentiment": "neutral",
            "category": "general",
            "actionable": False,
            "error": str(e)
        }

def get_feedbacks():
    docs = db.collection("museum_feedback").stream()
    feedbacks = []
    for doc in docs:
        data = doc.to_dict()
        data["doc_id"] = doc.id
        # Only process if not already analyzed or if you want to re-analyze
        if "ai_analysis" not in data: 
            feedbacks.append(data)
    return feedbacks

def analyze_and_store():
    print("Fetching feedbacks...")
    feedbacks = get_feedbacks()
    print(f"Found {len(feedbacks)} unanalyzed feedbacks.")

    for fb in feedbacks:
        if not fb.get("processed"):
            fb["processed"] = True
            text = fb.get("feedback_text", "")
            if not text:
                continue
                
            print(f"Analyzing: {text[:50]}...")
            analysis = analyze_feedback(text)
            print(f"Result: {analysis}")
            
            db.collection("museum_feedback") \
            .document(fb["doc_id"]) \
            .update({
                "ai_analysis": analysis
            })
            print("Updated Firestore.")

if __name__ == "__main__":
    analyze_and_store()
