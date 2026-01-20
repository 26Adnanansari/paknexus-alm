from fastapi import FastAPI, Request, Response
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
import traceback

from app.core.database import get_master_db_pool, close_master_db_pool, TenantDatabaseFactory
from app.middleware.tenant import TenantMiddleware
from app.core.config import settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    # Startup
    logger.info("Starting application...")
    pool = await get_master_db_pool()
    app.state.db_pool = pool
    logger.info("Application started successfully")
    
    yield
    
    # Shutdown
    logger.info("Shutting down application...")
    await close_master_db_pool()
    await TenantDatabaseFactory.close_all_tenant_pools()
    logger.info("Application shutdown complete")

app = FastAPI(
    title="Multi-Tenant SaaS Control Plane",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.CORS_ORIGINS.split(",")],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global exception: {str(exc)}")
    logger.error(traceback.format_exc())
    
    # Manually add CORS headers to exception response if needed
    # (Though CORSMiddleware usually handles it, sometimes it doesn't on crash)
    response = JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error", "error": str(exc)}
    )
    
    # Try to copy CORS headers from request origin
    origin = request.headers.get("origin")
    if origin:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        
    return response

# Add tenant middleware
@app.on_event("startup")
async def add_middleware():
    pool = await get_master_db_pool()
    app.add_middleware(TenantMiddleware, db_pool=pool)

# Health check endpoint
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "control-plane"
    }

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "Multi-Tenant SaaS Control Plane API",
        "version": "1.0.0"
    }

# Import routers
from app.api.v1 import admin, auth, modules, school, public, students, staff, attendance, curriculum

app.include_router(admin.router, prefix=f"{settings.API_V1_STR}/admin", tags=["admin"])
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(modules.router, prefix=f"{settings.API_V1_STR}/modules", tags=["modules"])
app.include_router(school.router, prefix=f"{settings.API_V1_STR}/school", tags=["school"])
app.include_router(public.router, prefix=f"{settings.API_V1_STR}/public", tags=["public"])
app.include_router(students.router, prefix=f"{settings.API_V1_STR}/students", tags=["students"])
app.include_router(staff.router, prefix=f"{settings.API_V1_STR}/staff", tags=["staff"])
app.include_router(attendance.router, prefix=f"{settings.API_V1_STR}/attendance", tags=["attendance"])
app.include_router(curriculum.router, prefix=f"{settings.API_V1_STR}/curriculum", tags=["curriculum"])

from app.api.v1 import refunds
app.include_router(refunds.router, prefix=f"{settings.API_V1_STR}/refunds", tags=["refunds"])

from app.api.v1 import moments, nexus
app.include_router(moments.router, prefix=f"{settings.API_V1_STR}/moments", tags=["moments"])
app.include_router(nexus.router, prefix=f"{settings.API_V1_STR}/nexus", tags=["nexus"])
