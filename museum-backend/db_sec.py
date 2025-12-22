import os
import bcrypt
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

load_dotenv()
DB_URL = os.getenv("DATABASE_URL")


def get_conn():
    """Establish database connection"""
    return psycopg2.connect(DB_URL, cursor_factory=RealDictCursor)


# ==================== PASSWORD HASHING ====================

def hash_password(password):
    """
    Hash a plain text password using bcrypt.
    
    Args:
        password (str): Plain text password
    
    Returns:
        str: Hashed password (salt + hash combined)
    """
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    print(hashed)
    return hashed.decode('utf-8')


def verify_password(password, hashed_password):
    """
    Verify a plain text password against a bcrypt hash.
    
    Args:
        password (str): Plain text password from login
        hashed_password (str): Stored hashed password from DB
    
    Returns:
        bool: True if password matches, False otherwise
    """
    print(hashed_password)
    return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))


# ==================== USER SIGNUP ====================

def signup_user(name, email, role, password):
    """
    Register a new user in the Authentication table with bcrypt hashed password.
    
    Args:
        name (str): User's full name
        email (str): User's email (must be unique)
        role (str): User's role ('admin' or 'guide')
        password (str): Plain text password
    
    Returns:
        dict: {'success': bool, 'message': str, 'user_id': int or None}
    """
    try:
        conn = get_conn()
        cursor = conn.cursor()
        
        # Check if email already exists
        check_query = "SELECT id FROM \"Authentication\" WHERE \"Email\" = %s"
        cursor.execute(check_query, (email,))
        
        if cursor.fetchone():
            cursor.close()
            conn.close()
            return {
                'success': False,
                'message': 'Email already exists. Please use a different email.',
                'user_id': None
            }
        
        # Hash password before storing
        hashed_password = hash_password(password)
        
        # Insert new user into Authentication table with hashed password
        insert_query = """
            INSERT INTO \"Authentication\" (\"Name\", \"Email\", \"Role\", \"Password_hash\")
            VALUES (%s, %s, %s, %s)
            RETURNING id
        """
        cursor.execute(insert_query, (name, email, role, hashed_password))
        user_id = cursor.fetchone()['id']
        conn.commit()
        
        cursor.close()
        conn.close()
        
        return {
            'success': True,
            'message': 'User registered successfully!',
            'user_id': user_id
        }
    
    except psycopg2.IntegrityError as e:
        conn.rollback()
        cursor.close()
        conn.close()
        return {
            'success': False,
            'message': 'Email already exists or invalid role. login in',
            'user_id': None
        }
    
    except Exception as e:
        return {
            'success': False,
            'message': f'Signup failed: {str(e)}',
            'user_id': None
        }


# ==================== USER LOGIN ====================

# def login_user(email, role, password):
#     """
#     Authenticate a user by verifying email, role, and password using bcrypt.
    
#     Args:
#         email (str): User's email
#         role (str): User's role ('admin' or 'guide')
#         password (str): Plain text password from login
    
#     Returns:
#         dict: {'success': bool, 'message': str, 'user': dict or None}
#     """
#     try:
#         conn = get_conn()
#         cursor = conn.cursor()
        
#         # Query user with matching email and role
#         query = """
#             SELECT id, \"Name\", \"Email\", \"Role\", \"Password_hash\"
#             FROM \"Authentication\"
#             WHERE \"Email\" = %s AND \"Role\" = %s
#         """
#         cursor.execute(query, (email, role))
#         user = cursor.fetchone()
        
#         cursor.close()
#         conn.close()
        
#         # Check if user exists
#         if not user:
#             return {
#                 'success': False,
#                 'message': 'Invalid credentials. Email or role not found.',
#                 'user': None
#             }
        
#         # Verify password using bcrypt
#         if verify_password(password, user['Password_hash']):
#             return {
#                 'success': True,
#                 'message': 'Login successful!',
#                 'user': {
#                     'id': user['id'],
#                     'name': user['Name'],
#                     'email': user['Email'],
#                     'role': user['Role']
#                 }
#             }
#         else:
#             return {
#                 'success': False,
#                 'message': 'Invalid credentials. Incorrect password.',
#                 'user': None
#             }
    
#     except Exception as e:
#         return {
#             'success': False,
#             'message': f'Login failed: {str(e)}',
#             'user': None
#         }
def login_user(email, role, password):
    try:
        conn = get_conn()
        cursor = conn.cursor()

        query = """
            SELECT id, "Name", "Email", "Role", "Password_hash"
            FROM "Authentication"
            WHERE "Email" = %s AND "Role" = %s
        """
        cursor.execute(query, (email, role))
        user = cursor.fetchone()

        if not user:
            return {
                'success': False,
                'message': 'Invalid credentials. Email or role not found.',
                'user': None
            }

        if verify_password(password, user['Password_hash']):
            return {
                'success': True,
                'message': 'Login successful!',
                'user': {
                    'id': user['id'],
                    'name': user['Name'],
                    'email': user['Email'],
                    'role': user['Role']
                }
            }
        else:
            return {
                'success': False,
                'message': 'Invalid credentials. Incorrect password.',
                'user': None
            }

    except Exception as e:
        return {
            'success': False,
            'message': f'Login failed: {str(e)}',
            'user': None
        }

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

