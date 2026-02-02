from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field, validator
from datetime import date, time
from typing import List, Optional
from database import get_conn
import random

router = APIRouter(tags=["Tours"])

# --- Pydantic Schema ---
class TourCreate(BaseModel):
    guide_id: int = Field(..., description="ID of the Guide (Staff)")  # ✅ CHANGED to guide_id: int
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
@router.get("/api/tours/guide-view", status_code=200)
def get_guide_tours_with_visitors(email: str):
    """
    GUIDE DASHBOARD ENDPOINT - Fetch tours with full visitor details
    
    Query Flow:
    1. Find staff by email + occupation = 'Tour_guide'
    2. Find all tours for that guide_id
    3. For each tour, fetch visitors from attends_tour + visitor table
    4. Return tours with nested visitor details
    """
    conn = get_conn()
    cur = conn.cursor()
    try:
        query = """
            SELECT 
                t.tour_id,
                t.guide_id,
                t.tour_date,
                t.tour_time,
                t.visitor_group_name,
                t.group_size,
                t.language,
                t.status,
                json_agg(
                    json_build_object(
                        'visitor_id', v.visitor_id,
                        'name', v.name,
                        'nationality', v.nationality,
                        'preferred_language', v.preferred_language,
                        'contact', v.contact
                    ) ORDER BY v.visitor_id
                ) FILTER (WHERE v.visitor_id IS NOT NULL) as visitors
            FROM tours t
            LEFT JOIN attends_tour at ON t.tour_id = at.tour_id
            LEFT JOIN visitor v ON at.visitor_id = v.visitor_id
            JOIN staff s ON t.guide_id = s.staff_id
            WHERE s.email = %s AND s.occupation = 'Tour_guide'
            GROUP BY t.tour_id, t.guide_id, t.tour_date, t.tour_time, 
                     t.visitor_group_name, t.group_size, t.language, t.status
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

@router.post("/api/tours", status_code=201)
def create_tour(tour: TourCreate):
    conn = get_conn()
    cur = conn.cursor()
    
    try:
        # STEP 1: Validate guide_id exists and is a tour guide
        cur.execute(
            "SELECT staff_id FROM staff WHERE staff_id = %s AND occupation = 'Tour_guide'",
            (tour.guide_id,)
        )
        staff_result = cur.fetchone()
        
        if not staff_result:
            raise HTTPException(status_code=404, detail=f"No tour guide found with ID: {tour.guide_id}")
        
        guide_id = tour.guide_id
        
        # STEP 2: Generate random tour_id
        tour_id = random.randint(10000, 99999)
        
        # STEP 3: Insert into tours table
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
        
        # STEP 4: Insert into attends_tour table (ONE row per visitor)
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
