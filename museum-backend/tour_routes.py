from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field, validator
from datetime import date, time
from typing import List, Optional
from database import get_conn
import random

router = APIRouter(tags=["Tours"])

# --- Pydantic Schema ---
class TourCreate(BaseModel):
    guide_email: str = Field(..., description="Email of the Guide")  # ADD THIS
    tour_date: date = Field(..., description="Date of the tour")
    tour_time: str = Field(..., description="Time of the tour (HH:MM)")
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

@router.get("/api/tours", status_code=200)
def get_tours(
    date: Optional[date] = None,
    guide_id: Optional[int] = None,
    status: Optional[str] = None
):
    conn = get_conn()
    cur = conn.cursor()
    try:
        query = "SELECT * FROM tours"
        conditions = []
        params = []
        
        if date:
            conditions.append("tour_date = %s")
            params.append(date)
        if guide_id:
            conditions.append("guide_id = %s")
            params.append(guide_id)
        if status:
            conditions.append("status = %s")
            params.append(status)
            
        if conditions:
            query += " WHERE " + " AND ".join(conditions)
            
        cur.execute(query, tuple(params))
        rows = cur.fetchall()
        return rows
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()
@router.get("/api/tours/by-guide-email", status_code=200)
def get_tours_by_guide_email(email: str):
    """Fetch tours assigned to a specific guide by their email."""
    conn = get_conn()
    cur = conn.cursor()
    try:
        query = """
            SELECT t.* FROM tours t
            JOIN staff s ON t.guide_id = s.staff_id
            WHERE s.email = %s AND s.occupation = 'Tour_guide'
            ORDER BY t.tour_date DESC
        """
        cur.execute(query, (email,))
        rows = cur.fetchall()
        return rows
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()
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
    
    try:
        # STEP 1: Convert guide_email to guide_id
        cur.execute(
            "SELECT staff_id FROM staff WHERE email = %s AND occupation = 'Tour_guide'",
            (tour.guide_email,)
        )
        staff_result = cur.fetchone()
        
        if not staff_result:
            raise HTTPException(status_code=404, detail=f"No tour guide found with email: {tour.guide_email}")
        
        guide_id = staff_result['staff_id']
        
        # STEP 2: Generate random tour_id
        tour_id = random.randint(10000, 99999)
        
        # STEP 3: Insert tour with guide_id (not guide_email)
        cur.execute("""
            INSERT INTO tours (
                tour_id, guide_id, tour_date, tour_time, visitor_group_name,
                group_size, language, status
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING tour_id;
        """, (
            tour_id, guide_id, tour.tour_date, tour.tour_time,
            tour.visitor_group_name, tour.group_size, tour.language, tour.status
        ))
        
        new_tour_id = cur.fetchone()['tour_id']
        
        # STEP 4: Insert visitor mappings
        for visitor_id in tour.visitor_ids:
            cur.execute("""
                INSERT INTO attends_tour (visitor_id, tour_id)
                VALUES (%s, %s)
            """, (visitor_id, new_tour_id))
        
        conn.commit()
        return {"message": "Tour scheduled successfully", "tour_id": new_tour_id}
        
    except HTTPException:
        conn.rollback()
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()
