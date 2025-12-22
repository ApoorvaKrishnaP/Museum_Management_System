from fastapi import APIRouter, status, HTTPException
from auth_schemas import SignupRequest, LoginRequest, SignupResponse, LoginResponse
from db_sec import signup_user, login_user

# Create router for authentication endpoints
router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/signup", response_model=SignupResponse, status_code=status.HTTP_201_CREATED)
def signup(request: SignupRequest):
    """
    Register a new user account.
    
    - **name**: User's full name
    - **email**: Valid email address (must be unique)
    - **role**: 'admin' or 'guide'
    - **password**: Must be at least 8 characters
    
    Returns:
    - **201 Created**: User successfully registered
    - **400 Bad Request**: Email already exists or validation failed
    """
    # Validate role
    if request.role not in ["admin", "guide"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role must be 'admin' or 'guide'"
        )
    
    # Call database function to signup user
    result = signup_user(request.name, request.email, request.role, request.password)
    
    if not result['success']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result['message']
        )
    
    return SignupResponse(
        success=result['success'],
        message=result['message'],
        user_id=result['user_id']
    )


@router.post("/login", response_model=LoginResponse, status_code=status.HTTP_200_OK)
def login(request: LoginRequest):
    """
    Authenticate a user and return user details.
    
    - **email**: User's email address
    - **role**: 'admin' or 'guide'
    - **password**: User's password
    
    Returns:
    - **200 OK**: Login successful, returns user information
    - **401 Unauthorized**: Invalid email, role, or password
    """
    # Validate role
    if request.role not in ["admin", "guide"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role must be 'admin' or 'guide'"
        )
    
    # Call database function to login user
    result = login_user(request.email, request.role, request.password)
    
    if not result['success']:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=result['message']
        )
    
    return LoginResponse(
        success=result['success'],
        message=result['message'],
        user=result['user']
    )
