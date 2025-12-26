from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr, Field, validator
from datetime import date
from database import get_conn
import re
from typing import Optional

router = APIRouter(tags=["Staff"])

# --- Pydantic Schemas ---

class StaffCreate(BaseModel):
    name: str = Field(..., min_length=2, description="Staff full name")
    occupation: str = Field(..., description="Role/Occupation")
    contact: str = Field(..., description="Contact number (10-15 digits)")
    joining_date: date = Field(..., description="Date of joining")
    email: EmailStr = Field(..., description="Email address")

    @validator('name')
    def name_validations(cls, v):
        v = v.strip()
        if len(v) < 2:
            raise ValueError('Name must be at least 2 characters')
        return v

    @validator('occupation')
    def validate_occupation(cls, v):
        allowed_roles = ['Customer_care', 'Tour_guide', 'Security', 'Admin', 'Manager', 'Custodian']
        if v not in allowed_roles:
            raise ValueError(f"Occupation must be one of {allowed_roles}")
        return v

    @validator('contact')
    def validate_contact(cls, v):
        # Allow optional leading +, then 10-15 digits
        pattern = r"^\+?[0-9]{10,15}$"
        if not re.match(pattern, v):
            raise ValueError("Contact must be 10-15 digits")
        return v

    @validator('joining_date')
    def date_cannot_be_future(cls, v):
        if v > date.today():
            raise ValueError("Joining date cannot be in the future")
        return v

    @validator('email')
    def lower_email(cls, v):
        return v.lower()

# --- Routes ---

@router.post("/api/staff", status_code=201)
def create_staff(staff: StaffCreate):
    conn = get_conn()
    cur = conn.cursor()
    
    import random
    random_id = random.randint(1000, 9999)

    try:
        # Check for duplicates
        cur.execute("SELECT staff_id FROM staff WHERE email = %s OR contact = %s", (staff.email, staff.contact))
        if cur.fetchone():
            raise HTTPException(status_code=400, detail="Staff with this email or contact already exists.")

        cur.execute("""
            INSERT INTO staff (
                staff_id, name, occupation, contact, joining_date, email
            ) VALUES (
                %s, %s, %s, %s, %s, %s
            ) RETURNING staff_id;
        """, (
            random_id,
            staff.name,
            staff.occupation,
            staff.contact,
            staff.joining_date,
            staff.email
        ))
        
        new_id = cur.fetchone()['staff_id']
        conn.commit()
        return {"message": "Staff registered successfully", "staff_id": new_id}
        
    except Exception as e:
        conn.rollback()
        if "duplicate key" in str(e):
             raise HTTPException(status_code=400, detail="Staff with this email or contact already exists.")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        @router.get("/api/staff", status_code=200)
        def get_staff(
            role: Optional[str] = None,
            name: Optional[str] = None
        ):
            conn = get_conn()
            cur = conn.cursor()
            try:
                query = "SELECT * FROM staff"
                conditions = []
                params = []
                
                if role:
                    conditions.append("occupation = %s")
                    params.append(role)
                if name:
                    conditions.append("name ILIKE %s")
                    params.append(f"%{name}%")
                    
                if conditions:
                    query += " WHERE " + " AND ".join(conditions)
                
                query += " ORDER BY staff_id ASC"
                    
                cur.execute(query, tuple(params))
                rows = cur.fetchall()
                return rows
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
            finally:
                cur.close()
                conn.close()

@router.put("/api/staff/{staff_id}", status_code=200)
def update_staff(staff_id: int, staff: StaffCreate):
    conn = get_conn()
    cur = conn.cursor()
    try:
        cur.execute("SELECT staff_id FROM staff WHERE staff_id = %s", (staff_id,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Staff not found")

        cur.execute("""
            UPDATE staff 
            SET name=%s, occupation=%s, contact=%s, joining_date=%s, email=%s
            WHERE staff_id=%s
        """, (
            staff.name, staff.occupation, staff.contact, staff.joining_date, staff.email, staff_id
        ))
        conn.commit()
        return {"message": "Staff updated successfully"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()

@router.delete("/api/staff/{staff_id}", status_code=200)
def delete_staff(staff_id: int):
    conn = get_conn()
    cur = conn.cursor()
    try:
        cur.execute("DELETE FROM staff WHERE staff_id = %s RETURNING staff_id", (staff_id,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Staff not found")
        conn.commit()
        return {"message": "Staff deleted successfully"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()
