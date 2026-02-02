from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr, Field, validator
from datetime import date
from database import get_conn
from db_sec import hash_password, verify_password
from typing import Optional

router = APIRouter(tags=["Visitors"])

# --- Pydantic Schemas ---

class VisitorSignup(BaseModel):
    name: str = Field(..., min_length=2)
    email: EmailStr
    password: str = Field(..., min_length=8)

    @validator('name')
    def name_must_be_trimmed(cls, v):
        return v.strip()

class VisitorLogin(BaseModel):
    email: EmailStr
    password: str

class VisitorCreate(BaseModel):
    """For admin to create visitor records"""
    name: str = Field(..., min_length=2)
    email: EmailStr
    age_group: str = Field(default="Adult")
    nationality: str = Field(default="General")
    preferred_language: str = Field(default="English")
    ticket_type: str = Field(default="Standard")
    id_proof: str = Field(default="Online")
    contact: Optional[str] = Field(default=None, pattern=r"^\+?[0-9]{7,15}$")
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
def signup_visitor(visitor: VisitorSignup):
    """Visitor self-registration - only Authentication table"""
    conn = get_conn()
    cur = conn.cursor()
    try:
        # Check if email already exists
        cur.execute('SELECT id FROM "Authentication" WHERE "Email" = %s', (visitor.email.lower(),))
        if cur.fetchone():
            raise HTTPException(status_code=400, detail="Email already registered")

        # Hash password
        hashed_password = hash_password(visitor.password)

        # Insert into Authentication table ONLY
        cur.execute("""
            INSERT INTO "Authentication" ("Name", "Email", "Role", "Password_hash")
            VALUES (%s, %s, %s, %s)
            RETURNING id
        """, (visitor.name, visitor.email.lower(), 'visitor', hashed_password))
        
        auth_id = cur.fetchone()['id']
        conn.commit()
        
        return {
            "message": "Visitor registered successfully",
            "role": "visitor",
            "name": visitor.name,
            "email": visitor.email
        }
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cur.close()
        conn.close()

@router.post("/api/visitors/login", status_code=200)
def login_visitor(login_data: VisitorLogin):
    """Visitor login - check Authentication table"""
    conn = get_conn()
    cur = conn.cursor()
    try:
        # Check Authentication table for visitor role
        cur.execute("""
            SELECT "Name", "Email", "Password_hash" FROM "Authentication"
            WHERE "Email" = %s AND "Role" = 'visitor'
        """, (login_data.email.lower(),))
        auth = cur.fetchone()
        
        if not auth:
            raise HTTPException(status_code=401, detail="Invalid credentials")

        if not verify_password(login_data.password, auth["Password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid credentials")

        return {
            "message": "Login successful",
            "name": auth["Name"],
            "email": auth["Email"],
            "role": "visitor"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()

@router.post("/api/admin/visitors", status_code=201)
def create_visitor_record(visitor: VisitorCreate):
    """Admin creates visitor record in visitor table"""
    conn = get_conn()
    cur = conn.cursor()
    try:
        # Check if email exists in Authentication
        cur.execute('SELECT id FROM "Authentication" WHERE "Email" = %s AND "Role" = \'visitor\'', 
                    (visitor.email.lower(),))
        if not cur.fetchone():
            raise HTTPException(status_code=400, detail="Visitor must signup first")

        # Insert visitor profile
        cur.execute("""
            INSERT INTO visitor (
                name, age_group, email, nationality, preferred_language,
                last_visit_date, ticket_type, id_proof, contact
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s
            ) RETURNING visitor_id;
        """, (
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
        return {"visitor_id": new_id, "message": "Visitor record created successfully"}
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cur.close()
        conn.close()

@router.get("/api/visitors", status_code=200)
def get_visitors(name: Optional[str] = None, nationality: Optional[str] = None):
    """Admin view all visitor records"""
    conn = get_conn()
    cur = conn.cursor()
    try:
        query = "SELECT * FROM visitor"
        conditions = []
        params = []
        
        if name:
            conditions.append("name ILIKE %s")
            params.append(f"%{name}%")
        if nationality:
            conditions.append("nationality = %s")
            params.append(nationality)
            
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

@router.put("/api/visitors/{visitor_id}", status_code=200)
def update_visitor(visitor_id: int, visitor: VisitorCreate):
    """Admin update visitor record"""
    conn = get_conn()
    cur = conn.cursor()
    try:
        cur.execute("SELECT visitor_id FROM visitor WHERE visitor_id = %s", (visitor_id,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Visitor not found")

        cur.execute("""
            UPDATE visitor 
            SET name=%s, age_group=%s, email=%s, nationality=%s, preferred_language=%s, 
                last_visit_date=%s, ticket_type=%s, id_proof=%s, contact=%s
            WHERE visitor_id=%s
        """, (
            visitor.name, visitor.age_group, visitor.email.lower(), visitor.nationality, 
            visitor.preferred_language, visitor.last_visit_date, visitor.ticket_type, 
            visitor.id_proof, visitor.contact, visitor_id
        ))
        conn.commit()
        return {"message": "Visitor updated successfully"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()