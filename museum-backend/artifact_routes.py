import random
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field, validator
from typing import List, Optional
from database import get_conn

router = APIRouter(tags=["Artifact"])

# --- Pydantic Schema ---
class ArtifactBase(BaseModel):
    gallery_id: int = Field(..., description="ID of the gallery")
    historical_period: str = Field(..., min_length=1)
    category: str = Field(..., min_length=1)
    material: str = Field(..., min_length=1)
    condition_status: str = Field(..., min_length=1)
    audio_guide_id: Optional[int] = Field(None)

    @validator('historical_period', 'category', 'material', 'condition_status')
    def not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError('Must not be empty or whitespace only')
        return v

class ArtifactCreate(ArtifactBase):
    pass

class ArtifactUpdate(ArtifactBase):
    pass

class ArtifactResponse(ArtifactBase):
    artifact_id: int

# --- Routes ---

@router.get("/api/artifacts", status_code=200)
def get_artifacts(
    gallery_id: Optional[int] = None,
    category: Optional[str] = None,
    historical_period: Optional[str] = None
):
    conn = get_conn()
    cur = conn.cursor()
    try:
        query = "SELECT * FROM artifact_information"
        conditions = []
        params = []
        
        if gallery_id:
            conditions.append("gallery_id = %s")
            params.append(gallery_id)
        if category:
            conditions.append("category ILIKE %s")
            params.append(f"%{category}%")
        if historical_period:
            conditions.append("historical_period ILIKE %s")
            params.append(f"%{historical_period}%")
            
        if conditions:
            query += " WHERE " + " AND ".join(conditions)
            
        query += " ORDER BY artifact_id ASC"
            
        cur.execute(query, tuple(params))
        rows = cur.fetchall()
        return rows
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()

@router.post("/api/artifacts", status_code=201)
def create_artifact(artifact: ArtifactCreate):
    conn = get_conn()
    cur = conn.cursor()
    try:
        # Check if gallery exists
        cur.execute("SELECT gallery_id FROM gallery WHERE gallery_id = %s", (artifact.gallery_id,))
        if not cur.fetchone():
            raise HTTPException(status_code=400, detail="Invalid Gallery ID")

        artifact_id = random.randint(1000, 9999)
        cur.execute("""
            INSERT INTO artifact_information (artifact_id, gallery_id, historical_period, category, material, condition_status, audio_guide_id)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING artifact_id
        """, (artifact_id, artifact.gallery_id, artifact.historical_period, artifact.category, artifact.material, artifact.condition_status, artifact.audio_guide_id))
        
        new_id = cur.fetchone()['artifact_id']
        conn.commit()
        return {"message": "Artifact created", "artifact_id": new_id}
    except Exception as e:
        conn.rollback()
        if "foreign key" in str(e).lower():
             raise HTTPException(status_code=400, detail="Foreign Key Error: Check Gallery ID.")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()

@router.put("/api/artifacts/{artifact_id}")
def update_artifact(artifact_id: int, artifact: ArtifactUpdate):
    conn = get_conn()
    cur = conn.cursor()
    try:
        cur.execute("""
            UPDATE artifact_information 
            SET gallery_id=%s, historical_period=%s, category=%s, material=%s, condition_status=%s, audio_guide_id=%s
            WHERE artifact_id=%s
        """, (artifact.gallery_id, artifact.historical_period, artifact.category, artifact.material, artifact.condition_status, artifact.audio_guide_id, artifact_id))
        
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Artifact not found")
            
        conn.commit()
        return {"message": "Artifact updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()

@router.delete("/api/artifacts/{artifact_id}")
def delete_artifact(artifact_id: int):
    conn = get_conn()
    cur = conn.cursor()
    try:
        cur.execute("DELETE FROM artifact_information WHERE artifact_id = %s", (artifact_id,))
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Artifact not found")
        conn.commit()
        return {"message": "Artifact deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()

@router.get("/api/artifacts/enriched", status_code=200)
def get_enriched_artifacts():
    conn = get_conn()
    cur = conn.cursor()
    try:
        # Fetch ONLY from artefact_media as requested
        query = "SELECT * FROM artefact_media ORDER BY artifact_id, media_type"
        cur.execute(query)
        rows = cur.fetchall()
        
        artifacts_map = {}
        
        for row in rows:
            aid = row['artifact_id']
            if aid not in artifacts_map:
                # Determine Gallery Name dynamically based on description/name
                name = row['artifact_name']
                desc = row['artifact_description'] or ""
                
                gallery_name = "General Exhibition"
                if "Vase" in name or "Song" in desc:
                    gallery_name = "Imperial Ceramics Gallery"
                elif "Book" in name or "Kells" in desc:
                    gallery_name = "Medieval Manuscripts Hall"
                elif "Sword" in name or "Tipu" in desc:
                    gallery_name = "Royal Armory"
                elif "Textile" in name or "Chakla" in desc:
                    gallery_name = "Cultural Textiles Exhibit"
                
                artifacts_map[aid] = {
                    "artifact_id": aid,
                    "name": name, 
                    "gallery_name": gallery_name,
                    "historical_period": "Various", # Placeholder since we are ignoring Artifact_Information
                    "category": "Artifact",
                    "material": "Mixed Media",
                    "condition_status": "Displayed",
                    "description": "", # Will fill below
                    "image_url": None,
                    "audio_url": None
                }
            
            # Fix Google Cloud Storage URLs to be public accessible
            url = row['media_url']
            if url and "storage.cloud.google.com" in url:
                url = url.replace("storage.cloud.google.com", "storage.googleapis.com")
            
            if row['media_type'] == 'image':
                artifacts_map[aid]['image_url'] = url
                # Use description from the image row as primary description if available
                if row['artifact_description']:
                    artifacts_map[aid]['description'] = row['artifact_description']
            elif row['media_type'] == 'audio':
                artifacts_map[aid]['audio_url'] = url
                # If description was empty (e.g. image row had none), try audio row
                if not artifacts_map[aid]['description'] and row['artifact_description']:
                     artifacts_map[aid]['description'] = row['artifact_description']

        return list(artifacts_map.values())

    except Exception as e:
        print(f"Error fetching enriched artifacts: {e}") 
        return []
    finally:
        cur.close()
        conn.close()
