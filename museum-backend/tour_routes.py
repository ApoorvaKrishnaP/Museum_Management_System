from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field, validator
from datetime import date, time
from typing import List, Optional
from database import get_conn
import random

router = APIRouter(tags=["Tours"])

# --- Pydantic Schema ---
class TourCreate(BaseModel):
    guide_id: int = Field(..., description="ID of the Guide (Staff)")
    tour_date: date = Field(..., description="Date of the tour")
    tour_time: str = Field(..., description="Time of the tour (HH:MM)") # Receive as string, validation handles conversion if needed or just pass to DB which handles string->time
    visitor_group_name: str = Field(..., min_length=1, description="Name of the visitor group")
    group_size: int = Field(..., gt=0, description="Number of visitors")
    language: str = Field(..., description="Tour language")
    status: str = Field("Scheduled", description="Status of the tour")
    visitor_ids: List[int] = Field(..., description="List of Visitor IDs")

    @validator('status')
    def validate_status(cls, v):
        allowed = ['Scheduled', 'Completed', 'Cancelled', 'Pending']
        if v not in allowed:
            raise ValueError(f"Status must be one of {allowed}")
        return v
    
    @validator('visitor_ids')
    def validate_visitor_ids(cls, v):
        if not v:
             raise ValueError("At least one Visitor ID must be provided")
        return v

# --- Routes ---

@router.get("/api/guides", status_code=200)
def get_tour_guides():
    """Fetch all staff members who are Tour Guides for the dropdown."""
    conn = get_conn()
    cur = conn.cursor()
    try:
        cur.execute("SELECT staff_id, name FROM staff WHERE occupation = 'Tour_guide'")
        guides = cur.fetchall()
        # guides will be a list of RealDictRow or tuples depending on cursor factory.
        # Assuming RealDictCursor (from previous files observation if any, or standard tuple)
        # Let's assume RealDictCursor is used in get_conn or we handle it.
        # If tuple: (id, name)
        
        # Safe way if we aren't sure of cursor factory:
        result = []
        for g in guides:
             # If g is dict-like
             if isinstance(g, dict):
                 result.append({"staff_id": g['staff_id'], "name": g['name']})
             else:
                 # If tuple
                 result.append({"staff_id": g[0], "name": g[1]})
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()

@router.post("/api/tours", status_code=201)
def create_tour(tour: TourCreate):
    conn = get_conn()
    cur = conn.cursor()
    
    tour_id = random.randint(1000, 9999) # Random 4-digit ID

    try:
        # 1. Verify Guide Exists and is a Tour Guide
        cur.execute("SELECT staff_id FROM staff WHERE staff_id = %s AND occupation = 'Tour_guide'", (tour.guide_id,))
        if not cur.fetchone():
            raise HTTPException(status_code=400, detail="Invalid Guide ID or Staff is not a Tour Guide.")

        # 2. Verify all Visitor IDs exist (Optional)

        # 3. Create Tour
        cur.execute("""
            INSERT INTO tours (
                tour_id, guide_id, tour_date, tour_time, visitor_group_name, 
                group_size, language, status, visitor_ids
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s
            ) RETURNING tour_id;
        """, (
            tour_id,
            tour.guide_id,
            tour.tour_date,
            tour.tour_time,
            tour.visitor_group_name,
            tour.group_size,
            tour.language,
            tour.status,
            tour.visitor_ids
        ))
        
        new_id = cur.fetchone()['tour_id'] 
        conn.commit()
        return {"message": "Tour scheduled successfully", "tour_id": new_id}

    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()
