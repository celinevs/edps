from flask import Blueprint, request, jsonify, redirect, url_for, session
from app import db
from app.models.User import User
from app.models.Prodi import Prodi
from app.utils.response_handler import success_response, error_response
from app.utils.decorator import role_required
from flask_jwt_extended import jwt_required, get_jwt_identity

user_bp = Blueprint('user', __name__)

@user_bp.route('/users', methods=['POST'])
@jwt_required()
@role_required('ADMIN', 'SUPERADMIN')
def create_user():
    data = request.get_json()

    email = data.get('email')
    role = data.get('role')
    id_prodi = data.get('id_prodi') or None
    id_fakultas = data.get('id_fakultas') or None
    username = data.get('username')

    if not email or not role:
        return error_response("Email and role are required", 400)
    
    if role == 'PRODI' and not id_prodi:
        return error_response("Prodi are required", 400)

    existing_user = User.query.filter_by(email=email).first()
    existing_prodi = Prodi.query.filter_by(id_prodi=id_prodi).first()
    if existing_user:
        return error_response("Email already used", 409)
    
    if existing_prodi:
        id_fakultas = existing_prodi.id_fakultas


    new_user = User(
        email=email,
        role=role,
        id_prodi = id_prodi,
        id_fakultas = id_fakultas,
        username=username,
        is_active=True
    )

    db.session.add(new_user)
    db.session.commit()

    return success_response(
        message="User created successfully",
    )

@user_bp.route('/users', methods=['GET'])
@jwt_required()
@role_required('ADMIN', 'SUPERADMIN')
def get_users():

    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    current_role = current_user.role
    disable_pagination = request.args.get('disable_pagination', 'false').lower() == 'true'
    page = int(request.args.get('page', 1))
    page_size = int(request.args.get('page_size', 10))

    query = User.query

    query = query.filter(User.id_user != current_user_id)

    if current_role == "ADMIN":
        query = query.filter(User.role != "SUPERADMIN")

    if disable_pagination:
        users = query.all()

        return success_response(
            data=[user.to_dict() for user in users]
        )

    pagination = query.paginate(
        page=page,
        per_page=page_size,
        error_out=False
    )

    users = pagination.items

    return success_response(
        data={
            "results": [user.to_dict() for user in users],
            "totalCount": pagination.total,
            "currentPage": pagination.page,
            "pageSize": pagination.per_page,
            "totalPages": pagination.pages,
        },
        message="Data user berhasil diambil",
    )

@user_bp.route('/users/<string:id_user>', methods=['PUT'])
@jwt_required()
@role_required('ADMIN', 'SUPERADMIN')
def update_user(id_user):
    try:
        data = request.get_json()

        user = User.query.get(id_user)
        if not user:
            return error_response("User not found", 404)

        email = data.get('email')
        role = data.get('role')
        id_prodi = data.get('id_prodi')
        id_fakultas = data.get('id_fakultas')
        username = data.get('username')
        is_active = data.get('is_active')

        if email and email != user.email:
            existing_user = User.query.filter_by(email=email).first()
            if existing_user:
                return error_response("Email already used", 409)
            user.email = email

        if role:
            if role == 'PRODI' and not id_prodi:
                return error_response("Prodi is required for PRODI role", 400)
            user.role = role

        if role == 'PRODI':
            user.id_prodi = id_prodi
            existing_prodi = Prodi.query.filter_by(id_prodi=id_prodi).first()
            user.id_fakultas = existing_prodi.id_fakultas
            
        elif role and role != 'PRODI':
            user.id_prodi = None

        if username is not None:
            user.username = username
        
        if id_fakultas is not None and role == 'UPPS':
            user.id_fakultas = id_fakultas

        if is_active is not None:
            user.is_active = is_active

        db.session.commit()

        return success_response(
            message="User updated successfully",
        )

    except Exception as e:
        db.session.rollback()
        return error_response(f"Terjadi kesalahan: {str(e)}", 500)

@user_bp.route('/users/<string:user_id>', methods=['DELETE'])
@jwt_required()
@role_required('ADMIN', 'SUPERADMIN')
def delete_user(user_id):
    user = User.query.get(user_id)

    if not user:
        return error_response("User not found", 404)

    db.session.delete(user)
    db.session.commit()

    return success_response(message="User deleted successfully")