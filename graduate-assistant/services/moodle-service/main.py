"""
Moodle Integration Service - FastAPI Application

This service provides REST API endpoints for interacting with Moodle platform.
It uses Selenium for web scraping to fetch course and assignment data.
"""

from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uvicorn
import os
from dotenv import load_dotenv
from scraper.adapter import MoodleService

# Load environment variables
load_dotenv()

# Create FastAPI app
app = FastAPI(
    title="Moodle Integration Service",
    description="REST API for Moodle course and assignment data extraction",
    version="1.0.0"
)

# Configure CORS
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Key Authentication
API_KEY = os.getenv("API_KEY", "default-secret-key")

def verify_api_key(x_api_key: str = Header(...)):
    """Verify API key from request header"""
    if x_api_key != API_KEY:
        raise HTTPException(status_code=403, detail="Invalid API Key")
    return x_api_key

# Request/Response Models
class LoginRequest(BaseModel):
    username: str = Field(..., description="Moodle username/student ID")
    password: str = Field(..., description="Moodle password")
    base_url: Optional[str] = Field(None, description="Moodle base URL")

class LoginResponse(BaseModel):
    success: bool
    message: str
    session_id: Optional[str] = None

class Course(BaseModel):
    id: str
    name: str
    url: str
    description: Optional[str] = None

class CourseContent(BaseModel):
    section_name: str
    activities: List[Dict[str, Any]]

class CourseDetail(BaseModel):
    id: str
    name: str
    url: str
    description: Optional[str] = None
    contents: List[CourseContent]

class Assignment(BaseModel):
    id: str
    course_id: str
    course_name: str
    name: str
    due_date: Optional[str] = None
    status: Optional[str] = None
    url: str

class SyncRequest(BaseModel):
    username: str
    password: str
    base_url: Optional[str] = None

class SyncResponse(BaseModel):
    success: bool
    message: str
    courses_count: int
    assignments_count: int
    data: Dict[str, Any]

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "moodle-integration-service"}

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "service": "Moodle Integration Service",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }

# Moodle API Endpoints
@app.post("/api/moodle/login", response_model=LoginResponse)
async def login(
    request: LoginRequest,
    api_key: str = Depends(verify_api_key)
):
    """
    Login to Moodle and create a session

    This endpoint authenticates with Moodle using the provided credentials.
    """
    try:
        base_url = request.base_url or os.getenv("MOODLE_BASE_URL")
        if not base_url:
            raise HTTPException(status_code=400, detail="Moodle base URL is required")

        service = MoodleService(
            base_url=base_url,
            username=request.username,
            password=request.password,
            headless=True
        )

        result = service.login()
        return LoginResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Login failed: {str(e)}")

@app.get("/api/moodle/courses", response_model=List[Course])
async def get_courses(
    api_key: str = Depends(verify_api_key)
):
    """
    Get list of all enrolled courses

    Returns a list of courses the authenticated user is enrolled in.
    Uses credentials from environment variables.
    """
    try:
        base_url = os.getenv("MOODLE_BASE_URL")
        username = os.getenv("MOODLE_USERNAME")
        password = os.getenv("MOODLE_PASSWORD")

        if not all([base_url, username, password]):
            raise HTTPException(
                status_code=500,
                detail="Moodle credentials not configured in environment"
            )

        service = MoodleService(
            base_url=base_url,
            username=username,
            password=password,
            headless=True
        )

        courses = service.get_courses()
        return courses
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch courses: {str(e)}")

@app.get("/api/moodle/courses/{course_id}", response_model=CourseDetail)
async def get_course_detail(
    course_id: str,
    api_key: str = Depends(verify_api_key)
):
    """
    Get detailed information about a specific course

    Returns course details including all course contents and activities.
    Uses credentials from environment variables.
    """
    try:
        base_url = os.getenv("MOODLE_BASE_URL")
        username = os.getenv("MOODLE_USERNAME")
        password = os.getenv("MOODLE_PASSWORD")

        if not all([base_url, username, password]):
            raise HTTPException(
                status_code=500,
                detail="Moodle credentials not configured in environment"
            )

        service = MoodleService(
            base_url=base_url,
            username=username,
            password=password,
            headless=True
        )

        course = service.get_course_detail(course_id)

        if not course:
            raise HTTPException(status_code=404, detail="Course not found")

        return course
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch course detail: {str(e)}")

@app.get("/api/moodle/assignments", response_model=List[Assignment])
async def get_assignments(
    course_id: Optional[str] = None,
    api_key: str = Depends(verify_api_key)
):
    """
    Get list of assignments

    Optionally filter by course_id.
    Uses credentials from environment variables.
    """
    try:
        base_url = os.getenv("MOODLE_BASE_URL")
        username = os.getenv("MOODLE_USERNAME")
        password = os.getenv("MOODLE_PASSWORD")

        if not all([base_url, username, password]):
            raise HTTPException(
                status_code=500,
                detail="Moodle credentials not configured in environment"
            )

        service = MoodleService(
            base_url=base_url,
            username=username,
            password=password,
            headless=True
        )

        assignments = service.get_assignments(course_id=course_id)
        return assignments
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch assignments: {str(e)}")

@app.post("/api/moodle/sync", response_model=SyncResponse)
async def sync_moodle_data(
    request: SyncRequest,
    api_key: str = Depends(verify_api_key)
):
    """
    Perform a full sync of Moodle data

    This endpoint scrapes all courses and assignments from Moodle
    and returns the complete dataset. This can take several minutes
    depending on the number of courses.
    """
    try:
        base_url = request.base_url or os.getenv("MOODLE_BASE_URL")
        if not base_url:
            raise HTTPException(status_code=400, detail="Moodle base URL is required")

        service = MoodleService(
            base_url=base_url,
            username=request.username,
            password=request.password,
            headless=True
        )

        result = service.sync_all()
        return SyncResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sync failed: {str(e)}")

# Error handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "error": str(exc)}
    )

# Run server
if __name__ == "__main__":
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))

    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=True,
        log_level="info"
    )
