from flask import Blueprint, request, jsonify, redirect, url_for, session
from flask_jwt_extended import create_access_token, create_refresh_token, get_jwt_identity, jwt_required, get_jwt, set_access_cookies, set_refresh_cookies, unset_jwt_cookies
from authlib.integrations.flask_client import OAuth
# from app.models import db, User
from app.models.User import User
from app.config import Config
from app.utils.response_handler import success_response, error_response
import secrets
import redis
import time

auth_bp = Blueprint('auth', __name__)
oauth = OAuth()

# Configure OAuth providers
oauth.register(
    name='google',
    client_id=Config.GOOGLE_CLIENT_ID,
    client_secret=Config.GOOGLE_CLIENT_SECRET,
    server_metadata_url=Config.GOOGLE_DISCOVERY_URL,
    client_kwargs={'scope': 'openid email profile'}
)

#Configure redis to store access key & refresh key that hasnt expired but unable to use
jwt_redis_blocklist = redis.StrictRedis(
    host="redis", port=6379, db=0, decode_responses=True
)

# @auth_bp.route('/login', methods=['POST'])
# def login():
#     """Local login"""
#     data = request.get_json()
#     user = User.query.filter_by(email=data['email']).first()
    
#     if not user or not user.check_password(data['password']):
#         return jsonify({'error': 'Invalid credentials'}), 401
    
#     if not user.is_active:
#         return jsonify({'error': 'Account is deactivated'}), 403
    
#     access_token = create_access_token(
#         identity=user.id,
#         additional_claims={'role': user.role, 'email': user.email}
#     )
#     refresh_token = create_refresh_token(identity=user.id)
    
#     return jsonify({
#         'access_token': access_token,
#         'refresh_token': refresh_token,
#         'user': user.to_dict()
#     }), 200

# OAuth routes
@auth_bp.route('/login/<provider>')
def oauth_login(provider):
    """Initiate OAuth login"""
    if provider not in ['google']:
        return error_response(f"Invalid provider", 400)

    nonce = secrets.token_urlsafe(16)
    session['oauth_nonce'] = nonce
    
    redirect_uri = url_for(f'auth.oauth_callback', provider=provider, _external=True)
    return oauth.create_client(provider).authorize_redirect(redirect_uri, nonce=nonce)

@auth_bp.route('/callback/<provider>')
def oauth_callback(provider):
    """OAuth callback"""
    if provider not in ['google']:
        return error_response(f"Invalid provider", 400)
    
    client = oauth.create_client(provider)
    token = client.authorize_access_token()
    
    nonce = session.pop('oauth_nonce', None)

    try:
        user_info = client.parse_id_token(token, nonce=nonce)
    except Exception as e:
        return error_response(f"Failed to parse ID token: {str(e)}", 400)

    email = user_info['email']
    google_name = user_info['name']
    
    # Check if user exists
    user = User.query.filter_by(email=email).first()
    
    if not user:
        return redirect("http://localhost:3000/login?error=Account not found. Please contact the admin for access.")
    
    if not user.is_active:
         return redirect("http://localhost:3000/login?error=Account deactivated")
    
    # if not user.username:
    #     user.username = google_name
    #     db.session.commit()
    
    # Create JWT tokens
    access_token = create_access_token(
        identity=user.id_user,
        additional_claims={'role': user.role, 'email': user.email}
    )
    refresh_token = create_refresh_token(
        identity=user.id_user,
        additional_claims={
            "role": user.role,
            "email": user.email,
        }
    )

    response = redirect("http://localhost:3000/dashboard")
    set_access_cookies(response, access_token)
    set_refresh_cookies(response, refresh_token)

    return response
    
    # return success_response(data={
    #     'access_token': access_token,
    #     'refresh_token': refresh_token,
    #     'user': user.to_dict()
    # })

# We are using the `refresh=True` options in jwt_required to only allow refresh tokens to access this route.
@auth_bp.route("/auth/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    user_id = get_jwt_identity()
    jwt_data = get_jwt()
    
    new_access = create_access_token(identity=user_id,  additional_claims={
        "role": jwt_data.get("role"),
        "email": jwt_data.get("email"),
    }, fresh=False)

    response = jsonify({"message": "Refreshed"})

    set_access_cookies(response, new_access)

    return response
    # return success_response({"access_token": new_access})

@auth_bp.route("/logout", methods=["DELETE"])
@jwt_required()
def logout():
    token = get_jwt()
    jti = token["jti"]
    exp = token["exp"]
    
    ttl = max(exp - int(time.time()), 0)
    
    jwt_redis_blocklist.set(jti, "revoked", ex=ttl)
    
    response = jsonify({"message": "Berhasil logout"})
    
    response.set_cookie(
        'access_token_cookie',
        '',
        expires=0,
        max_age=0,
        path= None,
        secure=False, 
        httponly=True,
        samesite='Lax'
    )
    response.set_cookie(
        'refresh_token_cookie',
        '',
        expires=0,
        max_age=0,
        path= None,
        secure=False,
        httponly=True,
        samesite='Lax'
    )
    
    # Also try unset_jwt_cookies as backup
    unset_jwt_cookies(response)
    
    return response

@auth_bp.route("/auth/me")
@jwt_required()
def get_me():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    return success_response(data=user.to_dict(), message='Data user berhasil diambil')
