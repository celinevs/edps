from flask import jsonify
from sqlalchemy.exc import SQLAlchemyError

def success_response(data=None, message="Success", status_code=200):
    """Format response sukses standar"""
    return jsonify({
        "success": True,
        "message": message,
        "data": data
    }), status_code

def error_response(message="Terjadi kesalahan", status_code=500, data=None):
    """Format response error standar"""
    return jsonify({
        "success": False,
        "message": message,
        "data": data
    }), status_code

def handle_exception(e):
    """Handler exception standar"""
    if isinstance(e, SQLAlchemyError):
        return error_response(f"Database error: {str(e)}", 500)
    return error_response(f"Terjadi kesalahan: {str(e)}", 500)