"""
NeonDB API client for automated database creation
"""
import httpx
import asyncio
from typing import Optional
import logging

logger = logging.getLogger(__name__)


class NeonDBClient:
    """Client for NeonDB API operations"""
    
    def __init__(self, api_key: str, project_id: str):
        self.api_key = api_key
        self.project_id = project_id
        self.base_url = "https://console.neon.tech/api/v2"
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
    
    async def create_database(self, database_name: str, branch: str = "main") -> dict:
        """
        Create a new database in NeonDB project
        
        Args:
            database_name: Name of the database to create (e.g., 'tenant_pakschool')
            branch: Branch name (default: 'main')
        
        Returns:
            dict: Database creation response
        """
        # NeonDB API requires branch-specific database creation
        url = f"{self.base_url}/projects/{self.project_id}/branches/{branch}/databases"
        
        payload = {
            "database": {
                "name": database_name,
                "owner_name": "neondb_owner"
            }
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(url, json=payload, headers=self.headers, timeout=30.0)
                response.raise_for_status()
                logger.info(f"Created database: {database_name}")
                return response.json()
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 409:
                logger.warning(f"Database {database_name} already exists")
                return {"status": "exists", "database": database_name}
            logger.error(f"Failed to create database: {e.response.text}")
            raise
        except Exception as e:
            logger.error(f"Error creating database: {e}")
            raise
    
    async def execute_sql(self, database_name: str, sql: str) -> dict:
        """
        Execute SQL on a database
        
        Args:
            database_name: Target database
            sql: SQL to execute
        
        Returns:
            dict: Execution response
        """
        url = f"{self.base_url}/projects/{self.project_id}/branches/main/databases/{database_name}/query"
        
        payload = {
            "query": sql
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(url, json=payload, headers=self.headers, timeout=60.0)
                response.raise_for_status()
                logger.info(f"Executed SQL on {database_name}")
                return response.json()
        except Exception as e:
            logger.error(f"Error executing SQL: {e}")
            raise
    
    async def apply_schema(self, database_name: str, schema_file_path: str) -> bool:
        """
        Apply schema from file to database
        
        Args:
            database_name: Target database
            schema_file_path: Path to SQL schema file
        
        Returns:
            bool: Success status
        """
        try:
            with open(schema_file_path, 'r') as f:
                schema_sql = f.read()
            
            await self.execute_sql(database_name, schema_sql)
            logger.info(f"Applied schema to {database_name}")
            return True
        except Exception as e:
            logger.error(f"Error applying schema: {e}")
            return False
    
    def generate_connection_string(self, database_name: str, host: str, user: str, password: str) -> str:
        """
        Generate PostgreSQL connection string
        
        Args:
            database_name: Database name
            host: NeonDB host
            user: Database user
            password: Database password
        
        Returns:
            str: Full connection string
        """
        return f"postgresql://{user}:{password}@{host}/{database_name}?sslmode=require&channel_binding=require"


async def create_tenant_database(
    school_name: str,
    api_key: str,
    project_id: str,
    host: str,
    user: str,
    password: str,
    schema_file: str = "app/db/tenant_schema_template.sql"
) -> tuple[str, str]:
    """
    Complete workflow to create tenant database
    
    Args:
        school_name: Name of the school/institution
        api_key: NeonDB API key
        project_id: NeonDB project ID
        host: NeonDB host
        user: Database user
        password: Database password
        schema_file: Path to schema file
    
    Returns:
        tuple: (database_name, connection_string)
    """
    # Generate database name
    db_name = f"tenant_{school_name.lower().replace(' ', '_').replace('-', '_')}"
    
    # Initialize client
    client = NeonDBClient(api_key, project_id)
    
    # Create database
    await client.create_database(db_name)
    
    # Wait a bit for database to be ready
    await asyncio.sleep(2)
    
    # Apply schema
    await client.apply_schema(db_name, schema_file)
    
    # Generate connection string
    connection_string = client.generate_connection_string(db_name, host, user, password)
    
    logger.info(f"Tenant database ready: {db_name}")
    return db_name, connection_string
