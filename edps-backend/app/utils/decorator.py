from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt, verify_jwt_in_request

def role_required(*roles):
    """Decorator to check if user has required role"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt()
            
            if claims.get('role') not in roles:
                return jsonify({
                    'error': 'Access forbidden: insufficient privileges',
                    'required_roles': roles,
                    'user_role': claims.get('role')
                }), 403
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def admin_required(f):
    """Convenience decorator for admin-only routes"""
    @wraps(f)
    @role_required('ADMIN', 'SUPERADMIN')
    def decorated_function(*args, **kwargs):
        return f(*args, **kwargs)
    return decorated_function