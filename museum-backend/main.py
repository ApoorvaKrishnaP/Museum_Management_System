from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import get_conn
from auth_routes import router as auth_router
from visitor_routes import router as visitor_router
from staff_routes import router as staff_router
from finance_routes import router as finance_router
from tour_routes import router as tour_router
from gallery_routes import router as gallery_router
from artifact_routes import router as artifact_router

app = FastAPI(title="Museum Analytics API")

# Configure CORS for frontend communication (MUST be added first)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],  # Update with your frontend URL
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

# Include authentication routes
app.include_router(auth_router)
app.include_router(visitor_router)
app.include_router(staff_router)
app.include_router(finance_router)
app.include_router(tour_router)
app.include_router(gallery_router)
app.include_router(artifact_router)
from analytics_routes import router as analytics_router
app.include_router(analytics_router)
from feedback_routes import router as feedback_router
app.include_router(feedback_router)

@app.get("/")
def read_root():
    return {"message": "Welcome to the MuseumGuide API!"}
# 1️⃣ Total visitors per day
@app.get("/api/visitors_per_day")
def visitors_per_day():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("""
        SELECT DATE(entry_timestamp) AS visit_date, COUNT(*) AS total_visitors
        FROM visitor
        GROUP BY visit_date
        ORDER BY visit_date;
    """)
    data = cur.fetchall()
    cur.close(); conn.close()
    return data


# 2️⃣ Visitors by ticket type
@app.get("/api/visitors_by_ticket")
def visitors_by_ticket():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("""
        SELECT ticket_type, COUNT(*) AS total_visitors
        FROM visitor
        GROUP BY ticket_type;
    """)
    data = cur.fetchall()
    cur.close(); conn.close()
    return data


# 3️⃣ Peak visitor hours
@app.get("/api/visitors_by_hour")
def visitors_by_hour():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("""
        SELECT EXTRACT(HOUR FROM entry_timestamp) AS hour_of_day, COUNT(*) AS total_visitors
        FROM visitor
        GROUP BY hour_of_day
        ORDER BY total_visitors DESC;
    """)
    data = cur.fetchall()
    cur.close(); conn.close()
    return data


# 4️⃣ Revenue by ticket type
@app.get("/api/revenue_by_ticket")
def revenue_by_ticket():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("""
        SELECT ticket_type, SUM(amount) AS revenue
        FROM revenue_finance
        GROUP BY ticket_type;
    """)
    data = cur.fetchall()
    cur.close(); conn.close()
    return data


# 5️⃣ Payment method popularity
@app.get("/api/payment_methods")
def payment_methods():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("""
        SELECT payment_method, COUNT(*) AS num_transactions
        FROM revenue_finance
        GROUP BY payment_method;
    """)
    data = cur.fetchall()
    cur.close(); conn.close()
    return data


# 6️⃣ Gallery & artifact condition
@app.get("/api/gallery_condition")
def gallery_condition():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("""
        SELECT g.name AS gallery_name, a.condition_status, COUNT(*) AS count
        FROM gallery g
        JOIN artifact_information a ON g.gallery_id = a.gallery_id
        GROUP BY g.name, a.condition_status
        ORDER BY g.name;
    """)
    data = cur.fetchall()
    cur.close(); conn.close()
    return data

# 7️⃣ Top 5 Most Visited Galleries
@app.get("/api/top_galleries")
def top_galleries():
    """
    Returns the top 5 galleries by average visit count.
    Useful for identifying the most popular sections of the museum.
    """
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("""
        SELECT 
            name AS gallery_name, 
            average_visit_count
        FROM gallery
        ORDER BY average_visit_count DESC
        LIMIT 5;
    """)
    data = cur.fetchall()
    cur.close()
    conn.close()
    return data

