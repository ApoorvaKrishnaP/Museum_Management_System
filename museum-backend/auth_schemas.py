from pydantic import BaseModel, EmailStr, Field
from typing import Optional


# ==================== REQUEST SCHEMAS ====================

class SignupRequest(BaseModel):
    """Schema for user signup request"""
    name: str = Field(..., min_length=1, max_length=100, description="User's full name")
    email: EmailStr = Field(..., description="User's email address")
    role: str = Field(..., description="User role: 'admin' or 'guide'")
    password: str = Field(..., min_length=8, description="Password must be at least 8 characters")
    
    class Config:
        schema_extra = {
            "example": {
                "name": "John Doe",
                "email": "john@example.com",
                "role": "guide",
                "password": "securepass123"
            }
        }


class LoginRequest(BaseModel):
    """Schema for user login request"""
    email: EmailStr = Field(..., description="User's email address")
    role: str = Field(..., description="User role: 'admin' or 'guide'")
    password: str = Field(..., min_length=8, description="User's password")
    
    class Config:
        schema_extra = {
            "example": {
                "email": "john@example.com",
                "role": "guide",
                "password": "securepass123"
            }
        }


# ==================== RESPONSE SCHEMAS ====================

class UserResponse(BaseModel):
    """Schema for user data in response"""
    id: int
    name: str
    email: str
    role: str


class SignupResponse(BaseModel):
    """Schema for signup response"""
    success: bool
    message: str
    user_id: Optional[int] = None


class LoginResponse(BaseModel):
    """Schema for login response"""
    success: bool
    message: str
    user: Optional[UserResponse] = None
