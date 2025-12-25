from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, validator
from datetime import date, datetime, time
from database import get_conn
import random

router = APIRouter(tags=["Finance"])

# --- Pydantic Schema ---
class FinanceCreate(BaseModel):
    visitor_id: int = Field(..., description="ID of the visitor")
    ticket_type: str = Field(..., description="Type of ticket")
    amount: float = Field(..., gt=0, description="Transaction amount")
    payment_method: str = Field(..., description="Method of payment")
    discount_applied: bool = Field(False, description="Whether discount was applied")
    counter_id: str = Field(..., description="Counter ID (e.g., C1, C2)")
    # Date and Time will be auto-generated for now/today on backend side usually, 
    # but we can accept them if needed. Let's auto-generate them to ensure consistency 
    # unless specified otherwise, but the image shows them as columns.
    
    @validator('ticket_type')
    def validate_ticket_type(cls, v):
        allowed = ['Standard', 'VIP', 'Student']
        if v not in allowed:
            raise ValueError(f"Ticket type must be one of {allowed}")
        return v

    @validator('payment_method')
    def validate_payment_method(cls, v):
        allowed = ['Card', 'UPI', 'Cash', 'Online']
        if v not in allowed:
            raise ValueError(f"Payment method must be one of {allowed}")
        return v

    @validator('counter_id')
    def validate_counter_id(cls, v):
        if not v.startswith('C'):
             raise ValueError("Counter ID must start with 'C'")
        return v

# --- Routes ---
@router.post("/api/finance", status_code=201)
def create_transaction(finance: FinanceCreate):
    conn = get_conn()
    cur = conn.cursor()
    
    transaction_id = random.randint(1000, 9999)
    current_date = date.today()
    current_time = datetime.now().time()

    try:
        # Check if visitor exists (Foreign Key constraint usually handles this, but good to check)
        cur.execute("SELECT visitor_id FROM visitor WHERE visitor_id = %s", (finance.visitor_id,))
        if not cur.fetchone():
             raise HTTPException(status_code=400, detail=f"Visitor ID {finance.visitor_id} does not exist.")

        cur.execute("""
            INSERT INTO revenue_finance (
                transaction_id, visitor_id, ticket_type, amount, payment_method, 
                discount_applied, counter_id, transaction_date, transaction_time
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s
            ) RETURNING transaction_id;
        """, (
            transaction_id,
            finance.visitor_id,
            finance.ticket_type,
            finance.amount,
            finance.payment_method,
            finance.discount_applied,
            finance.counter_id,
            current_date,
            current_time
        ))
        
        new_id = cur.fetchone()['transaction_id']
        conn.commit()
        return {"message": "Transaction recorded successfully", "transaction_id": new_id}
        
    except Exception as e:
        conn.rollback()
        if "foreign key constraint" in str(e).lower():
             raise HTTPException(status_code=400, detail="Invalid Visitor ID.")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()
