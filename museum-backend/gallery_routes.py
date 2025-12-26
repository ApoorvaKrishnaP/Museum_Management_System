import random
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field, validator
from typing import List, Optional
from database import get_conn

router = APIRouter(tags=["Gallery"])

# --- Pydantic Schema ---
class GalleryBase(BaseModel):
    name: str = Field(..., min_length=1)
    floor_number: int = Field(..., gt=0)
    theme: str = Field(..., min_length=1)
    average_visit_count: Optional[int] = Field(0)
    total_artefacts: Optional[int] = Field(0)

    @validator('name', 'theme')
    def not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError('Must not be empty or whitespace only')
        return v

class GalleryCreate(GalleryBase):
    pass

class GalleryUpdate(GalleryBase):
    pass

class GalleryResponse(GalleryBase):
    gallery_id: int

# --- Routes ---

@router.get("/api/galleries", status_code=200)
def get_galleries(name: Optional[str] = None):
    conn = get_conn()
    cur = conn.cursor()
    try:
        query = "SELECT * FROM gallery"
        params = []
        
        if name:
            query += " WHERE name ILIKE %s"
            params.append(f"%{name}%")
            
        query += " ORDER BY gallery_id ASC"
        
        cur.execute(query, tuple(params))
        rows = cur.fetchall()
        # Convert to list of dicts if using tuple cursor, or directly return if DictCursor
        return rows
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()

@router.post("/api/galleries", status_code=201)
def create_gallery(gallery: GalleryCreate):
    conn = get_conn()
    cur = conn.cursor()
    try:
        gallery_id = random.randint(1000, 9999)
        cur.execute("""
            INSERT INTO gallery (gallery_id, name, floor_number, theme, average_visit_count, total_artefacts)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING gallery_id
        """, (gallery_id, gallery.name, gallery.floor_number, gallery.theme, gallery.average_visit_count, gallery.total_artefacts))
        
        new_id = cur.fetchone()['gallery_id']
        conn.commit()
        return {"message": "Gallery created", "gallery_id": new_id}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()

@router.put("/api/galleries/{gallery_id}")
def update_gallery(gallery_id: int, gallery: GalleryUpdate):
    conn = get_conn()
    cur = conn.cursor()
    try:
        cur.execute("""
            UPDATE gallery 
            SET name=%s, floor_number=%s, theme=%s, average_visit_count=%s, total_artefacts=%s
            WHERE gallery_id=%s
        """, (gallery.name, gallery.floor_number, gallery.theme, gallery.average_visit_count, gallery.total_artefacts, gallery_id))
        
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Gallery not found")
            
        conn.commit()
        return {"message": "Gallery updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()

@router.delete("/api/galleries/{gallery_id}")
def delete_gallery(gallery_id: int):
    conn = get_conn()
    cur = conn.cursor()
    try:
        cur.execute("DELETE FROM gallery WHERE gallery_id = %s", (gallery_id,))
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Gallery not found")
        conn.commit()
        return {"message": "Gallery deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()
