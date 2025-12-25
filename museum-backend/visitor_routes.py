from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr, Field, validator
from datetime import date, datetime
from database import get_conn
from typing import Optional
import re

router = APIRouter(tags=["Visitors"])

# --- Pydantic Schemas ---

class VisitorCreate(BaseModel):
    name: str = Field(..., min_length=2, description="Visitor's full name")
    age_group: str = Field(..., description="Age group (e.g., 18-25, 26-40)")
    email: EmailStr = Field(..., description="Unique email address")
    nationality: str = Field(..., description="Nationality from dropdown")
    preferred_language: str = Field(..., description="Preferred language from dropdown")
    ticket_type: str = Field(..., description="Ticket type: Standard, VIP, Student")
    id_proof: str = Field(..., description="ID Proof document type")
    contact: str = Field(..., pattern=r"^\+?[0-9]{7,15}$", description="Contact number")
    
    # We will derive these or set defaults, but for the form we might not ask for last_visit_date if it's new
    # However, the user request says "Last Visit Date" in the form.
    last_visit_date: Optional[date] = None

    @validator('name')
    def name_must_be_trimmed(cls, v):
        return v.strip()

    @validator('ticket_type')
    def validate_ticket_type(cls, v):
        allowed = ['Standard', 'VIP', 'Student']
        if v not in allowed:
            raise ValueError(f"Ticket type must be one of {allowed}")
        return v

    @validator('last_visit_date')
    def date_cannot_be_future(cls, v):
        if v and v > date.today():
            raise ValueError("Last visit date cannot be in the future")
        return v

# --- Routes ---

@router.post("/api/visitors", status_code=201)
def create_visitor(visitor: VisitorCreate):
    conn = get_conn()
    cur = conn.cursor()
    
    
    # Check if email or contact already exists to provide better error
    

    # Generate a random 4-digit ID
    import random
    random_id = random.randint(1000, 9999)

    try:
        cur.execute("""
            INSERT INTO visitor (
                visitor_id, name, age_group, email, nationality, preferred_language, 
                last_visit_date, ticket_type, id_proof, contact
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
            ) RETURNING visitor_id;
        """, (
            random_id,
            visitor.name, 
            visitor.age_group, 
            visitor.email.lower(), 
            visitor.nationality, 
            visitor.preferred_language,
            visitor.last_visit_date,
            visitor.ticket_type,
            visitor.id_proof,
            visitor.contact
        ))
        
        new_id = cur.fetchone()['visitor_id']
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cur.close()
        conn.close()

    return {"message": "Visitor registered successfully", "visitor_id": new_id}
