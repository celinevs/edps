from flask import Blueprint, request
from app import db
from app.models.QuestionSet import QuestionSet
from app.models.Prodi import Prodi
from app.models.Lembaga import Lembaga
from app.models.User import User
from app.utils.response_handler import success_response, error_response, handle_exception
from app.utils.decorator import role_required
from flask_jwt_extended import jwt_required, get_jwt_identity

lembaga_bp = Blueprint("lembaga", __name__)

@lembaga_bp.route("/question-set", methods=["GET"])
@jwt_required()
def get_all_question_set():
    try:
        id_prodi = request.args.get("id_prodi")

        if not id_prodi:
            return error_response("Parameter 'id_prodi' wajib dikirim", 400)

        # Get prodi
        prodi = Prodi.query.get(id_prodi)
        if not prodi:
            return error_response(f"Prodi dengan id {id_prodi} tidak ditemukan", 404)

        # Ambil lembaga_ids dari prodi
        if not prodi.lembaga_ids:
            return success_response(
                data=[], 
                message="Tidak ada lembaga yang terdaftar untuk prodi ini"
            )

        query = QuestionSet.query.filter(
            QuestionSet.status_aktif.is_(True),
            QuestionSet.id_lembaga.in_(prodi.lembaga_ids)
        ).order_by(QuestionSet.question_set.desc())

        qs_list = query.all()

        results = []
        for qs in qs_list:
            results.append({
                "id_qs": qs.id_qs,
                "versi": qs.question_set,
                "tahun_berlaku": qs.tahun_berlaku,
                "id_lembaga": qs.id_lembaga,
                "nama_lembaga": qs.lembaga.nama_lembaga if qs.lembaga else None,
                "total_max_bobot": qs.total_max_bobot
            })

        if not results:
            return success_response(
                data=[], 
                message="Tidak ada question set aktif untuk prodi ini"
            )

        return success_response(
            data=results,
            message="Data question set berhasil diambil"
        )

    except Exception as e:
        return handle_exception(e)

@lembaga_bp.route("/question-set/pagination", methods=["GET"])
@jwt_required()
def get_paginate_question_set():
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 5, type=int)

        query = QuestionSet.query.filter(
            QuestionSet.status_aktif.is_(True),
        ).order_by(QuestionSet.question_set.desc())

        pagination = query.paginate(page=page, per_page=per_page, error_out=False)

        results = []
        for qs in pagination.items:
            results.append({
                "id_qs": qs.id_qs,
                "versi": qs.question_set,
                "tahun_berlaku": qs.tahun_berlaku,
                "id_lembaga": qs.id_lembaga,
                "nama_lembaga": qs.lembaga.nama_lembaga if qs.lembaga else None,
                "total_max_bobot": qs.total_max_bobot,
                "tanggal_aktif": qs.tanggal_aktif
            })

        return success_response(
            data={
                "results": results,
                "totalCount": pagination.total,
                "currentPage": pagination.page,
                "pageSize": pagination.per_page,
                "totalPages": pagination.pages,
            },
            message="Data question set berhasil diambil"
        )

    except Exception as e:
        return handle_exception(e)

@lembaga_bp.route("/lembaga", methods=["GET"])
@jwt_required()
def get_lembaga():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        id_prodi = request.args.get("id_prodi")
        
        if not id_prodi:
            id_prodi = user.id_prodi

        query = Lembaga.query

        if id_prodi:
            prodi = Prodi.query.get(id_prodi)
            if not prodi:
                return error_response(f"Prodi dengan id {id_prodi} tidak ditemukan", 404)

            query = query.filter(
                Lembaga.id_lembaga.in_(prodi.lembaga_ids)
            )


        query = query.order_by(Lembaga.id_lembaga.asc())

        lembaga_list = query.all()

        results = [l.to_dict() for l in lembaga_list]

        return success_response(
            data=results,
            message="Data question set berhasil diambil"
        )

    except Exception as e:
        return handle_exception(e)