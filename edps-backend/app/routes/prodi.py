from flask import Blueprint, request
from app import db
# from app.models import Prodi, lembaga
from app.models.Prodi import Prodi, Fakultas
from app.models.Lembaga import Lembaga
from app.utils.response_handler import success_response, error_response, handle_exception
from app.utils.decorator import role_required
from flask_jwt_extended import jwt_required

prodi_bp = Blueprint("prodi", __name__)

@prodi_bp.route("/prodi", methods=["GET"])
@jwt_required()
def get_prodi():
    id_fakultas = request.args.get('id_fakultas')
    
    try:
        query = Prodi.query
        if id_fakultas:
            query = query.filter(Prodi.id_fakultas == id_fakultas)
        
        prodi_list = query.order_by(Prodi.nama_prodi.asc()).all()

        results = []
        for prodi in prodi_list:
            
            results.append({
                "id_prodi": prodi.id_prodi,
                "nama_prodi": prodi.nama_prodi,
                "kode_prodi": prodi.kode_prodi,
                "fakultas": prodi.fakultas.nama_fakultas,
                "lembaga_ids": prodi.lembaga_ids
            })

        return success_response(
            data=results,
            message="Data dropdown prodi berhasil diambil"
        )

    except Exception as e:
        return handle_exception(e)

@prodi_bp.route("/fakultas", methods=["GET"])
@jwt_required()
def get_fakultas():
    try:
        fakultas_list = Fakultas.query.all()

        results = []
        for fakultas in fakultas_list:
            
            results.append({
                "id_fakultas": fakultas.id_fakultas,
                "nama_fakultas": fakultas.nama_fakultas,
            })

        return success_response(
            data=results,
            message="Data dropdown prodi berhasil diambil"
        )

    except Exception as e:
        return handle_exception(e)
    
@prodi_bp.route("/faculty", methods=["GET"])
@jwt_required()
def get_faculty():
    try:
        fakultas_list = Fakultas.query.all()

        results = []
        for fakultas in fakultas_list:
            
            results.append({
                'id_fakultas': fakultas.id_fakultas,
                'nama_fakultas': fakultas.nama_fakultas
            })

        return success_response(
            data=results,
            message="Data dropdown fakultas berhasil diambil"
        )

    except Exception as e:
        return handle_exception(e)

@prodi_bp.route("/prodi", methods=["POST"])
@jwt_required()
def add_prodi():
    try:
        data = request.get_json()

        required_fields = ["nama_prodi", "kode_prodi", "fakultas", 'lembaga_ids']

        for field in required_fields:
            if field not in data or not data[field]:
                return error_response(f"Field '{field}' wajib diisi", 400)
        
        if not isinstance(data["lembaga_ids"], list):
            return error_response("Field 'lembaga_ids' harus berupa array/list", 400)
        
        existing_lembaga = Lembaga.query.filter(
            Lembaga.id_lembaga.in_(data["lembaga_ids"])
        ).all()
        
        existing_ids = [reg.id_lembaga for reg in existing_lembaga]
        invalid_ids = set(data["lembaga_ids"]) - set(existing_ids)
        
        if invalid_ids:
            return error_response(
                f"Lembaga ID tidak valid: {', '.join(invalid_ids)}", 
                400
            )
        
        new_prodi = Prodi(
            nama_prodi=data["nama_prodi"],
            kode_prodi=data["kode_prodi"],
            fakultas=data["fakultas"],
            lembaga_ids=data["lembaga_ids"],
        )

        db.session.add(new_prodi)
        db.session.commit()

        return success_response(
            data=None,
            message="Data prodi berhasil ditambahkan"
        )

    except Exception as e:
        return handle_exception(e)