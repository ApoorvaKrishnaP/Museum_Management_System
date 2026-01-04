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
            
            # Fix Google Cloud Storage URLs to be public accessible
            url = row['media_url']
            if url and "storage.cloud.google.com" in url:
                url = url.replace("storage.cloud.google.com", "storage.googleapis.com")

            if aid not in artifacts_map:
                name = row['artifact_name']
                # Determine Gallery Name and Content dynamically
                gallery_name = "General Exhibition"
                desc = row['artifact_description'] or ""
                
                # Check for Specific Artifacts to inject User-Requested Content
                if "Vase" in name:
                    gallery_name = "Imperial Ceramics Gallery"
                    desc = "This elegant Song Dynasty Meiping vase exemplifies masterful ceramic artistry with its slender form and delicate incised floral patterns, showcasing the refinement of Yaozhou ware. The sharp, vigorous lines carved into the surface create dynamic, lifelike scrolling vines, demonstrating high technical skill and aesthetic balance. Its sophisticated design and pristine condition make it a significant piece reflecting imperial beauty and classical Chinese ceramic tradition."
                elif "Book" in name or "Kells" in name:
                    gallery_name = "Medieval Manuscripts Hall"
                    desc = "Book of Kells is a famous illuminated manuscript at Trinity College Library, Dublin: it's an early medieval gospel book (c. 800 AD) on vellum, renowned for its stunning, intricate Celtic knotwork, vibrant illustrations (like the famous Chi Rho page), and complex decorative initials, showcasing incredible artistry and devotion, a testament to early Irish monastic culture, with its pages offering a glimpse into early Christian iconography and intricate calligraphy, making it a treasure of Western art and literature."
                elif "Sword" in name or "Weapon" in name:
                    gallery_name = "Royal Armory"
                    desc = "This is a striking weapon on display is the personal sword of Tipu Sultan, the 18th-century ruler of Mysore. This exceptional sword features a watered steel blade, ornamented with fine floral motifs and inscriptions in gold that include Quranic verses and the name of its owner and his capital city, Srirangapatnam. The hilt, known as a Delhishahi hilt, is also heavily damascened in gold with creeper and floral designs and finished with a circular disc pommel and a small knuckle-guard. The weapon is housed in a wooden sheath covered in rich maroon velvet, showcasing it not just as a tool of war, but as a significant artifact of royal power, artistry, and a symbol of resistance against the British in Indian history."
                elif "Textile" in name:
                    gallery_name = "Cultural Textiles Exhibit"
                    desc = "The embroidered Indian Chakla is a decorative, often square, textile from regions like Gujarat and Rajasthan, traditionally used for special occasions like weddings, as a wall hanging, for wrapping gifts (rumal), or as a small decorative cloth, featuring vibrant hand-embroidery, mirror work (Shisha), and colorful threads, reflecting the rich traditions of communities like the Rabari or Ahir."
                
                artifacts_map[aid] = {
                    "artifact_id": aid,
                    "name": name, 
                    "gallery_name": gallery_name,
                    "historical_period": "Various", 
                    "category": "Artifact",
                    "material": "Mixed Media",
                    "condition_status": "Displayed",
                    "description": desc,
                    "image_url": None,
                    "audio_url": None
                }
            
            if row['media_type'] == 'image':
                artifacts_map[aid]['image_url'] = url
            elif row['media_type'] == 'audio':
                artifacts_map[aid]['audio_url'] = url

        return list(artifacts_map.values())

    except Exception as e:
        print(f"Error fetching enriched artifacts: {e}") 
        return []
    finally:
        cur.close()
        conn.close()
