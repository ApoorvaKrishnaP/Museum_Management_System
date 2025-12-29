from fastapi import APIRouter, HTTPException
from database import get_conn

router = APIRouter(tags=["Analytics"])

@router.get("/api/analytics/artifact-status", status_code=200)
def get_artifact_status_analytics():
    """
    Returns the distribution of artifacts based on their condition status.
    Example Output:
    [
        {"condition_status": "Good", "count": 120},
        {"condition_status": "Needs Repair", "count": 15}
    ]
    """
    conn = get_conn()
    cur = conn.cursor()
    try:
        cur.execute("""
            SELECT condition_status, COUNT(*) as count 
            FROM artifact_information 
            GROUP BY condition_status
        """)
        rows = cur.fetchall()
        
        # Ensure consistent output format
        # If using RealDictCursor, rows is already a list of dicts.
        # If using standard cursor, we might need to map it. 
        # Based on previous files, RealDictCursor is likely used.
        return rows
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()
