from flask import Blueprint, request
from app import db
from app.models.Jawaban import Jawaban
from app.models.Akreditasi import Akreditasi
from app.models.QuestionList import LamEmba, LamInfokom
from app.models.QuestionSet import QuestionSet
from app.models.User import User
from app.utils.response_handler import success_response, error_response, handle_exception
from app.utils.decorator import role_required
from datetime import datetime
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from sqlalchemy import func, case, cast, Date, Integer
from datetime import datetime, date
from app.service.analytic_service import fetch_data_from_db,prepare_features ,aggregate_per_exam, compute_and_combine_risk_metrics, compute_priority_table, predict_future_scores, generate_indicator_table, get_actual_vs_predicted

akreditasi_bp = Blueprint("akreditasi", __name__)

@akreditasi_bp.route("/ml-dashboard", methods=["GET"])
def ml_dashboard():
    # id_prodi = request.args.get("id_prodi")

    graph = get_actual_vs_predicted(filtered='infokom', id_prodi='PR001')

    return success_response( 
        data={
        "graph": graph.to_dict(orient="records"),
        },
        message="Dashboard fetched!"
    )

@akreditasi_bp.route('/akreditasi', methods=["GET"])
@jwt_required()
def get_akreditasi():
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 5, type=int)

        if page < 1 or per_page < 1:
            return error_response("Page dan per_page harus lebih dari 0", 400)

        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        role = user.role

        id_qs = request.args.get('id_qs')
        id_prodi = request.args.get('id_prodi') or user.id_prodi
        # id_lembaga = request.args.get('id_lembaga')
        tahun_berlaku = request.args.get('tahun_berlaku')
        status = request.args.get('status')
        fakultas = request.args.get('fakultas')
        available = request.args.get('available')
        id_lembaga = request.args.get('id_lembaga', type=int)
        only_null_assesor = request.args.get('only_null_assesor')
        is_home_page = request.args.get('is_home_page')

        query = Akreditasi.query
        today = date.today()
        
        if fakultas:
            query = query.filter(Akreditasi.prodi.has(fakultas=fakultas))

        if tahun_berlaku:
            query = query.filter(Akreditasi.tahun_berlaku == tahun_berlaku)

        if status:
            status_list = [s.strip() for s in status.split(",")]
            query = query.filter(Akreditasi.status.in_(status_list))

        if id_qs:
            query = query.filter(Akreditasi.id_qs == id_qs)
        
        if id_lembaga:
            query = query.join(
                QuestionSet,
                Akreditasi.id_qs == QuestionSet.id_qs
                ).filter(
                    QuestionSet.id_lembaga == id_lembaga
                )

        if id_prodi:
            query = query.filter(Akreditasi.id_prodi == id_prodi)
        
        if available is not None:
            available = available.lower() == "true"
            # if role == "PRODI":
            #         query = query.filter(
            #             Akreditasi.status == 'In Progress',
            #             cast(Akreditasi.tanggal_selesai_prodi, Date) >= today
            #         )
            if role == "LPMI":
                    if is_home_page is not None:
                        is_home_page = is_home_page.lower() == "true"
                        if is_home_page:
                            query = query.filter( Akreditasi.status.in_(['Submitted', 'Validating']),
                            cast(Akreditasi.tanggal_mulai, Date) <= today)
            else:
                    query = query.filter(
                        cast(Akreditasi.tanggal_mulai, Date) <= today)

        if only_null_assesor is not None:
            only_null_assesor = only_null_assesor.lower() == "true"
            if only_null_assesor:
                query = query.filter(Akreditasi.status.in_(['In Progress','Submitted', 'Validating']))
        

        summary = query.with_entities(
            func.sum(case((Akreditasi.status == 'In Progress', 1), else_=0)).label('in_progress'),
            func.sum(case((Akreditasi.status == 'Submitted', 1), else_=0)).label('submitted'),
            func.sum(case((Akreditasi.status == 'Validated', 1), else_=0)).label('validated'),
            func.sum(case((Akreditasi.status == 'Reviewed', 1), else_=0)).label('reviewed'),
        ).first()

        summary_response = {
            "in_progress": summary.in_progress or 0,
            "submitted": summary.submitted or 0,
            "validated": summary.validated or 0,
            "reviewed": summary.reviewed or 0,
        }

        pagination = query.paginate(page=page, per_page=per_page, error_out=False)

        

        results = []
        for a in pagination.items:
            progress = 0
            tanggal_selesai = a.tanggal_selesai_prodi
            if role == "PRODI":
                progress = a.progress_prodi
            elif role == "LPMI":
                progress = a.progress_lpmi
                tanggal_selesai = a.tanggal_selesai_lpmi
            elif role == "ADMIN" or role == "SUPERADMIN" or role == "UPPS":
                tanggal_selesai = a.tanggal_selesai_prodi
                if a.progress_lpmi != 100:
                    progress = a.progress_lpmi
                elif a.progress_prodi != 100:
                     progress = a.progress_prodi
                else:
                    progress = a.progress_assesor

            item = {
                "id_akreditasi": a.id_akreditasi,
                "nama_akreditasi": a.nama_akreditasi,
                "status": a.status,
                "tahun_berlaku": a.tahun_berlaku,
                "total_skor_prodi": a.total_skor_prodi,
                "total_skor_lpmi": a.total_skor_lpmi,
                "total_skor_assesor": a.total_skor_assesor,
                'progress': progress,
                "prodi": {
                    "id_prodi": a.prodi.id_prodi,
                    "kode_prodi": a.prodi.kode_prodi,
                    "nama_prodi": a.prodi.nama_prodi,
                    "fakultas": a.prodi.fakultas.nama_fakultas
                    } if a.prodi else None,
                
                "question_set": {
                    "id_qs": a.question_set.id_qs,
                    "id_lembaga": a.question_set.lembaga.id_lembaga,
                    "nama_lembaga": a.question_set.lembaga.nama_lembaga,
                    "total_max_bobot": a.question_set.total_max_bobot
                    } if a.question_set else None,
                
                "tanggal_mulai": a.tanggal_mulai,
                "tanggal_selesai": tanggal_selesai,
                "tanggal_pengisian": a.tanggal_pengisian,
                "tanggal_validasi": a.tanggal_validasi,
                "tanggal_review": a.tanggal_review,
                }
            
            if role in ["ADMIN", "SUPERADMIN"]:
                item["tanggal_selesai_lpmi"] = a.tanggal_selesai_lpmi

            results.append(item)

        return success_response(
            data={
                "results": results,
                "today": today,
                "totalCount": pagination.total,
                "currentPage": pagination.page,
                "pageSize": pagination.per_page,
                "totalPages": pagination.pages,
                "summary": summary_response
            },
            message="Data akreditasi berhasil diambil"
        )

    except Exception as e:
        return handle_exception(e)

@akreditasi_bp.route("/akreditasi/<id_akreditasi>", methods=["GET"])
@jwt_required()
def get_akreditasi_help(id_akreditasi):
    try:
        qs = Akreditasi.query.get(id_akreditasi)

        if not qs:
            return error_response("Question set not found", 404)

        return success_response(
            data={
                "email_pengisi": qs.pengisi.email if qs.pengisi else None,
                "email_validator": qs.validator.email if qs.validator else None,
                "tanggal_pengisian": qs.tanggal_pengisian,
                "tanggal_validasi": qs.tanggal_validasi,
                "label_link": qs.question_set.label_link,
                "link": qs.question_set.link,
                "gambar_path": qs.question_set.gambar_path,
                "deskripsi_gambar": qs.question_set.deskripsi_gambar,
            },
            message="Question set retrieved successfully"
        )

    except Exception as e:
        return handle_exception(e)

@akreditasi_bp.route('/akreditasi/dropdown', methods=["GET"])
@jwt_required()
def get_akreditasi_dropdown():
    try:
        id_prodi = request.args.get('id_prodi')
        id_lembaga = request.args.get('id_lembaga')

        query = Akreditasi.query

        if id_prodi:
            query = query.filter(Akreditasi.id_prodi == id_prodi)
        
        if id_lembaga:
             query = query.join(Akreditasi.question_set).filter(
                 QuestionSet.id_lembaga == id_lembaga
                 )
            
        akreditasi_list = query.all()
        
        results = []
        for a in akreditasi_list:
            results.append({
                "id_akreditasi": a.id_akreditasi,
                "nama_akreditasi": a.nama_akreditasi,
                })

        return success_response(
            data=results,
            message="Data akreditasi berhasil diambil"
        )

    except Exception as e:
        return handle_exception(e)

@akreditasi_bp.route("/akreditasi/tahun-berlaku", methods=["GET"])
@jwt_required()
def get_unique_tahun_berlaku():

    id_prodi = request.args.get('id_prodi')

    if id_prodi in ["", "undefined", "null"]:
        id_prodi = None

    query = db.session.query(Akreditasi.tahun_berlaku).distinct()

    if id_prodi:
        query = query.filter(Akreditasi.id_prodi == id_prodi)

    result = query.order_by(Akreditasi.tahun_berlaku.desc()).all()

    data = [row[0] for row in result]
    return success_response(data=data, message="Data tahun berlaku berhasil diambil")

@akreditasi_bp.route("/akreditasi/<id>/weight-summary/infokom", methods=["GET"])
@jwt_required()
def get_weight_summary_infokom(id):
    akreditasi = Akreditasi.query.get(id)
    if not akreditasi:
        return error_response("Akreditasi tidak ditemukan", 404)
    
    if akreditasi.question_set.lembaga.id_lembaga != 1:
            return error_response("Summary ini hanya untuk Infokom", 400)

    detail_data = (
    db.session.query(
        LamInfokom.kode_kriteria,
        LamInfokom.kriteria,
        LamInfokom.elemen_penilaian_lam,
        LamInfokom.q_no,
        LamInfokom.bobot,
        LamInfokom.id_qs,
        Jawaban.skor_prodi,
        Jawaban.skor_lpmi,
        Jawaban.skor_assesor,
    )
    .join(Jawaban, (Jawaban.id_qs == LamInfokom.id_qs) & (Jawaban.q_no == LamInfokom.q_no))
    .filter(Jawaban.id_akreditasi == id)
    .all())

    table = []
    kriteria_map = {}
    bobot_map = {}
    total_questions = 0
    total_max_point = 0

    total_lpmi_answered = 0
    total_assesor_answered = 0

    for row in detail_data:
        total_questions += 1
        bobot = row.bobot
        kriteria = row.kode_kriteria
        skor_prodi = row.skor_prodi if row.skor_prodi is not None else 0
        skor_lpmi = row.skor_lpmi if row.skor_lpmi is not None else 0
        skor_assesor = row.skor_assesor if row.skor_assesor is not None else 0
        
        if row.skor_lpmi is not None:
            total_lpmi_answered += 1
        if row.skor_assesor is not None:
            total_assesor_answered += 1

        detail_q = {
        "q_no": row.q_no,
        "kode_kriteria": kriteria,
        "max_weight": bobot,
        "skor_prodi": skor_prodi,
        "skor_lpmi": row.skor_lpmi,  # Keep original None for JSON response
        "skor_assesor": row.skor_assesor,  # Keep original None for JSON response
        "lpmi_answered": 1 if row.skor_lpmi is not None else 0,
        "assesor_answered": 1 if row.skor_assesor is not None else 0}

        # GROUP BY BOBOT (TABLE)
        if bobot not in bobot_map:
            bobot_map[bobot] = {
            "weight": bobot,
            "questions": 0,
            "max_weight": 0,
            "prodi": 0,
            "lpmi": 0,
            "assesor": 0,
            "lpmi_answered": 0,
            "assesor_answered": 0,
            "detail_question": []}
        
        bobot_map[bobot]["questions"] += 1
        bobot_map[bobot]["max_weight"] += bobot
        bobot_map[bobot]["prodi"] += skor_prodi
        bobot_map[bobot]["lpmi"] += skor_lpmi
        bobot_map[bobot]["assesor"] += skor_assesor
        if row.skor_lpmi is not None:
            bobot_map[bobot]["lpmi_answered"] += 1
        if row.skor_assesor is not None:
            bobot_map[bobot]["assesor_answered"] += 1
        bobot_map[bobot]["detail_question"].append(detail_q)

        total_max_point += bobot
        
        # GROUP BY KRITERIA
        if kriteria not in kriteria_map:
            kriteria_map[kriteria] = {
            "kriteria": kriteria,
            "total_pertanyaan": 0,
            "total_prodi": 0,
            "total_lpmi": 0,
            "total_assesor": 0,
            "max_weight": 0,
            "lpmi_answered": 0,
            "assesor_answered": 0,
            "detail": []}

        kriteria_map[kriteria]["total_pertanyaan"] += 1
        kriteria_map[kriteria]["total_prodi"] += skor_prodi
        kriteria_map[kriteria]["total_lpmi"] += skor_lpmi
        kriteria_map[kriteria]["total_assesor"] += skor_assesor
        kriteria_map[kriteria]["max_weight"] += bobot
        if row.skor_lpmi is not None:
            kriteria_map[kriteria]["lpmi_answered"] += 1
        if row.skor_assesor is not None:
            kriteria_map[kriteria]["assesor_answered"] += 1
        
        elemen = row.elemen_penilaian_lam
        detail_list = kriteria_map[kriteria]["detail"]
        found = False
        for item in detail_list:
            if item["elemen_kriteria"] == elemen:
                item["total_pertanyaan"] += 1
                item["prodi"] += skor_prodi
                item["lpmi"] += skor_lpmi
                item["assesor"] += skor_assesor
                item["weight"] += bobot
                if row.skor_lpmi is not None:
                    item["lpmi_answered"] = item.get("lpmi_answered", 0) + 1
                if row.skor_assesor is not None:
                    item["assesor_answered"] = item.get("assesor_answered", 0) + 1
                found = True
                break
        
        if not found:
            detail_list.append({
                "elemen_kriteria": elemen,
                "total_pertanyaan": 1,
                "prodi": skor_prodi,
                "lpmi": skor_lpmi,
                "assesor": skor_assesor,
                "weight": bobot,
                "lpmi_answered": 1 if row.skor_lpmi is not None else 0,
                "assesor_answered": 1 if row.skor_assesor is not None else 0
                })

    for bobot, val in bobot_map.items():
        val["assesor_lpmi"] = val["assesor"] - val["lpmi"]
        
        if val["lpmi_answered"] == 0:
            val["lpmi"] = None
        if val["assesor_answered"] == 0:
            val["assesor"] = None
            
        table.append(val)
        
    table.sort(key=lambda x: x["weight"], reverse=True)

    kriteria_table = list(kriteria_map.values())

    for item in kriteria_table:
        if item["lpmi_answered"] == 0:
            item["total_lpmi"] = None
        if item["assesor_answered"] == 0:
            item["total_assesor"] = None
            
        for detail_item in item["detail"]:
            if detail_item.get("lpmi_answered", 0) == 0:
                detail_item["lpmi"] = None
            if detail_item.get("assesor_answered", 0) == 0:
                detail_item["assesor"] = None

    return success_response(
        data={
            "detail": table,
            "kriteria_detail": kriteria_table,
            "answered_questions": total_questions,
            "lpmi_answered": total_lpmi_answered,
            "assesor_answered": total_assesor_answered,
            "total_questions": akreditasi.question_set.total_questions,
            "nama_pengisi": akreditasi.pengisi.username if akreditasi.pengisi else None,
            "nama_validator": akreditasi.validator.username if akreditasi.validator else None,
            "total_prodi": akreditasi.total_skor_prodi,
            "total_lpmi": akreditasi.total_skor_lpmi,
            "total_assesor": akreditasi.total_skor_assesor,
            "tanggal_pengisian": akreditasi.tanggal_pengisian,
            "tanggal_validasi": akreditasi.tanggal_validasi,
            "tanggal_review": akreditasi.tanggal_review,
            "total_points": akreditasi.question_set.total_max_bobot,
            'max_points': total_max_point
        },
        message="Weight summary berhasil diambil"
    )

@akreditasi_bp.route("/akreditasi/<id>/weight-summary/emba", methods=["GET"])
@jwt_required()
def get_weight_summary_emba(id):
    akreditasi = Akreditasi.query.get(id)
    if not akreditasi:
        return error_response("Akreditasi tidak ditemukan", 404)
    
    if akreditasi.question_set.lembaga.id_lembaga != 2:
            return error_response("Summary ini hanya untuk Emba", 400)

    detail_data = (
    db.session.query(
        LamEmba.kode_kriteria,
        LamEmba.kriteria,
        LamEmba.q_no,
        LamEmba.bobot,
        LamEmba.id_qs,
        LamEmba.mandatory,
        Jawaban.skor_prodi,
        Jawaban.skor_lpmi,
        Jawaban.skor_assesor,
    )
    .join(Jawaban, (Jawaban.id_qs == LamEmba.id_qs) & (Jawaban.q_no == LamEmba.q_no))
    .filter(Jawaban.id_akreditasi == id)
    .all())

    table = []
    kriteria_map = {}
    total_questions = 0
    total_max_point = 0

    for row in detail_data:
        total_questions += 1
        kriteria = row.kode_kriteria
        mandatory = row.mandatory
        skor_prodi = row.skor_prodi
        skor_lpmi = row.skor_lpmi
        skor_assesor = row.skor_assesor
        bobot = row.bobot 
        total_max_point += bobot
        
        # GROUP BY KRITERIA
        if kriteria not in kriteria_map:
            kriteria_map[kriteria] = {
            "kriteria": kriteria,
            "total_pertanyaan": 0,
            "total_prodi": 0,
            "total_lpmi": 0,
            "total_assesor": 0,
            "max_weight": 0,
            "mandatory_pass": True,
            "lpmi_count": 0,
            "assesor_count": 0,
            "detail": []}

        kriteria_map[kriteria]["total_pertanyaan"] += 1
        kriteria_map[kriteria]["max_weight"] += bobot

        if skor_lpmi is not None:
            kriteria_map[kriteria]["total_lpmi"] += skor_lpmi
            kriteria_map[kriteria]["lpmi_count"] += 1
        
        if skor_assesor is not None:
            kriteria_map[kriteria]["total_assesor"] += skor_assesor
            kriteria_map[kriteria]["assesor_count"] += 1
        
        if skor_prodi is not None:
            kriteria_map[kriteria]["total_prodi"] += skor_prodi
        
        kriteria_map[kriteria]["detail"].append({
        "q_no": row.q_no,
        "dimensi": row.kriteria,
        "prodi": skor_prodi,
        "lpmi": skor_lpmi,
        "assesor": skor_assesor,
        "mandatory_pass": True if (mandatory and skor_assesor == 1 ) else False,
        "weight": bobot
        })

        if mandatory and skor_assesor != 1:
            kriteria_map[kriteria]["mandatory_pass"] = False

    kriteria_table = list(kriteria_map.values())

    for item in kriteria_table:
        if item["lpmi_count"] == 0:
            item["total_lpmi"] = None

        if item["assesor_count"] == 0:
            item["total_assesor"] = None
        
    total_lpmi_answered = sum(1 for row in detail_data if row.skor_lpmi is not None)
    total_assesor_answered = sum(1 for row in detail_data if row.skor_assesor is not None)

    return success_response(
        data={
            "detail": table,
            "kriteria_detail": kriteria_table,
            "answered_questions": total_questions,
            "lpmi_answered": total_lpmi_answered,
            "assesor_answered": total_assesor_answered,
            "nama_pengisi": akreditasi.pengisi.username if akreditasi.pengisi else None,
            "nama_validator": akreditasi.validator.username if akreditasi.validator else None,
            "total_prodi": akreditasi.total_skor_prodi,
            "total_lpmi": akreditasi.total_skor_lpmi,
            "total_assesor": akreditasi.total_skor_assesor,
            "tanggal_pengisian": akreditasi.tanggal_pengisian,
            "tanggal_validasi": akreditasi.tanggal_validasi,
            "tanggal_review": akreditasi.tanggal_review,
            "total_questions": akreditasi.question_set.total_questions,
            "total_points": akreditasi.question_set.total_max_bobot,
            'max_points': total_max_point
        },
        message="Weight summary berhasil diambil"
    )


@akreditasi_bp.route("/akreditasi/dashboard/detail/infokom", methods=["GET"])
@jwt_required()
def get_dashboard_detail_infokom():
    try:
        id_akreditasi = request.args.get("id_akreditasi")

        if not id_akreditasi:
            return error_response("id_akreditasi wajib diisi", 400)
        
        akreditasi_obj = Akreditasi.query.get(id_akreditasi)
        id_qs = akreditasi_obj.id_qs
        
        year_data = (
            db.session.query(
                Akreditasi.id_akreditasi,
                Akreditasi.tahun_berlaku
                )
                .filter(
                    Akreditasi.id_qs == id_qs,
                    Akreditasi.id_prodi == akreditasi_obj.id_prodi
                    )
                    .order_by(
                        cast(func.substr(Akreditasi.tahun_berlaku, 6, 4), Integer).asc()
                        )
                        .all()
                        )
        
        current_index = None
        for i, row in enumerate(year_data):
            if row.id_akreditasi == id_akreditasi:
                current_index = i
                break

        last_akreditasi_id = None
        if current_index is not None and current_index > 0:
            last_akreditasi_id = year_data[current_index - 1].id_akreditasi
        
        last_detail_data = []
        
        if last_akreditasi_id:
            last_detail_data = (
                db.session.query(
                    LamInfokom.bobot,
                    Jawaban.skor_lpmi,
                    Jawaban.skor_assesor,
                    )
                .join(
                    Jawaban,
                    (Jawaban.id_qs == LamInfokom.id_qs) &
                    (Jawaban.q_no == LamInfokom.q_no)
                    )
                .filter(Jawaban.id_akreditasi == last_akreditasi_id)
                .all()
                )

        detail_data = (
            db.session.query(
                LamInfokom.bobot,
                Jawaban.skor_prodi,
                Jawaban.skor_lpmi,
                Jawaban.skor_assesor,
            )
            .join(
                Jawaban,
                (Jawaban.id_qs == LamInfokom.id_qs) &
                (Jawaban.q_no == LamInfokom.q_no)
            )
            .filter(Jawaban.id_akreditasi == id_akreditasi)
            .all()
        )

        bobot_map = {}
        has_lpmi_or_assesor_data = False

        for row in detail_data:
            bobot = row.bobot
            skor_prodi = row.skor_prodi or 0
            skor_lpmi = row.skor_lpmi or 0
            skor_assesor = row.skor_assesor or 0
            
            if skor_lpmi > 0 or skor_assesor > 0:
                has_lpmi_or_assesor_data = True

            if bobot not in bobot_map:
                bobot_map[bobot] = {
                    "weight": bobot,
                    "total_questions": 0,
                    "prodi": 0,
                    "lpmi": 0,
                    "assesor": 0,
                }

            bobot_map[bobot]["total_questions"] += 1
            bobot_map[bobot]["prodi"] += skor_prodi
            bobot_map[bobot]["lpmi"] += skor_lpmi
            bobot_map[bobot]["assesor"] += skor_assesor
        
        last_map = {}
        for row in last_detail_data:
            bobot = row.bobot
            lpmi = row.skor_lpmi or 0
            assesor = row.skor_assesor or 0
            if bobot not in last_map:
                last_map[bobot] = {
                "total": 0,
                "lpmi": 0,
                "assesor": 0
                }
            last_map[bobot]["total"] += 1
            last_map[bobot]["lpmi"] += lpmi
            last_map[bobot]["assesor"] += assesor

        table = []
        total_gap_prodi_lpmi = 0
        total_gap_lpmi_assesor = 0
        total_max_possible_gap = 0

        for val in bobot_map.values():
            total_q = val["total_questions"]
            bobot = val["weight"]
            last = last_map.get(bobot, {})

            avg_prodi = val["prodi"] / total_q if total_q else 0
            avg_lpmi = val["lpmi"] / total_q if total_q else 0
            avg_assesor = val["assesor"] / total_q if total_q else 0

            gap_prodi_lpmi = abs(avg_prodi - avg_lpmi)
            gap_lpmi_assesor = abs(avg_lpmi - avg_assesor)

            total_gap_prodi_lpmi += gap_prodi_lpmi
            total_gap_lpmi_assesor += gap_lpmi_assesor
            max_gap_per_question = bobot * 0.75
            total_max_possible_gap += total_q * max_gap_per_question

            last_avg_lpmi = (
                last.get("lpmi", 0) / last.get("total", 1)
                if last else None
                )
            
            last_avg_assesor = (
                last.get("assesor", 0) / last.get("total", 1)
                if last else None
                )

            table.append({
                "weight": bobot,
                "total_questions": total_q,

                "prodi": float(avg_prodi),
                "lpmi": float(avg_lpmi),
                "assesor": float(avg_assesor),

                "this_to_assesor": avg_lpmi - avg_assesor,
                "this_to_max": (float(bobot) - avg_lpmi) if bobot is not None else 0,

                "last_to_assesor": (
                    float(last_avg_lpmi) - float(last_avg_assesor)
                    if last and last_avg_lpmi is not None and last_avg_assesor is not None 
                    else None
                    ),
                "last_to_max": (
                    float(bobot) - float(last_avg_lpmi)
                    if last and last_avg_lpmi is not None and bobot is not None
                    else None
                    ),

                "percentage": (avg_assesor / float(bobot)) * 100 if bobot and bobot > 0 else 0,
            })

        table.sort(key=lambda x: x["weight"], reverse=True)

        consistency_score = None
        
        if has_lpmi_or_assesor_data and table and total_max_possible_gap > 0:
            avg_gap_prodi_lpmi_pct = (total_gap_prodi_lpmi / total_max_possible_gap) * 100
            avg_gap_lpmi_assesor_pct = (total_gap_lpmi_assesor / total_max_possible_gap) * 100
            overall_inconsistency = (avg_gap_prodi_lpmi_pct + avg_gap_lpmi_assesor_pct) / 2
            consistency_score = max(0, 100 - overall_inconsistency)
            
            consistency_score = round(consistency_score, 2)
        else:
            consistency_score = None

        radar_data = (
            db.session.query(
                LamInfokom.kode_kriteria,
                LamInfokom.kriteria,
                func.sum(LamInfokom.bobot).label("total_weight"),
                func.sum(Jawaban.skor_prodi).label("prodi"),
                func.sum(Jawaban.skor_lpmi).label("lpmi"),
                func.sum(Jawaban.skor_assesor).label("assesor"),
            )
            .join(
                Jawaban,
                (Jawaban.id_qs == LamInfokom.id_qs) &
                (Jawaban.q_no == LamInfokom.q_no)
            )
            .filter(Jawaban.id_akreditasi == id_akreditasi)
            .group_by(LamInfokom.kode_kriteria, LamInfokom.kriteria)
            .order_by(LamInfokom.kode_kriteria)
            .all()
        )

        labels = []
        prodi = []
        lpmi = []
        assesor = []

        for row in radar_data:
            weight = row.total_weight or 1
            labels.append(f"{row.kriteria}")
            prodi.append(((row.prodi or 0) / weight) * 100)
            lpmi.append(((row.lpmi or 0) / weight) * 100)
            assesor.append(((row.assesor or 0) / weight) * 100)

        radar = {
            "labels": labels,
            "datasets": {
                "prodi": prodi,
                "lpmi": lpmi,
                "assesor": assesor
            }
        }

        gap_heatmap = []
        max_gap_assesor = None
        for row in radar_data:
            weight = row.total_weight or 1

            gap_heatmap.append({
                "criteria": row.kriteria,
                "prodi_vs_lpmi": round(float(row.lpmi or 0) - float(row.prodi or 0), 2),
                "lpmi_vs_assesor": round(float(row.assesor or 0) - float(row.lpmi or 0), 2),
            })

            if (max_gap_assesor is None or abs(gap_lpmi_assesor) > abs(max_gap_assesor["value"])):
                max_gap_assesor = {
                    "criteria": row.kriteria,
                    "value": gap_lpmi_assesor
                    }

        akreditasi = (
            db.session.query(
                Akreditasi.tahun_berlaku,
                func.sum(Akreditasi.total_skor_prodi),
                func.sum(Akreditasi.total_skor_lpmi),
                func.sum(Akreditasi.total_skor_assesor),
                )
                .filter(
                # Akreditasi.id_qs == id_qs,
                Akreditasi.id_prodi == akreditasi_obj.id_prodi
                )
                .group_by(Akreditasi.tahun_berlaku)
                .order_by(cast(func.substr(Akreditasi.tahun_berlaku, 6, 4), Integer).desc())
                .limit(5)
                .all()
                )

        bar = {
            "labels": [r[0] for r in akreditasi],
            "datasets": {
                "prodi": [float(r[1] or 0) for r in akreditasi],
                "lpmi": [float(r[2] or 0) for r in akreditasi],
                "assesor": [float(r[3] or 0) for r in akreditasi],
                }
                }
        
        raw_df = fetch_data_from_db('infokom', id_prodi= akreditasi_obj.id_prodi, current_year=akreditasi_obj.tahun_berlaku)
        prediction_df = None

        
        if raw_df is not None and not raw_df.empty:
            feature_df = prepare_features(raw_df)
            prepared_df = aggregate_per_exam(feature_df)
            features = prepared_df.groupby(["major", "exam"], as_index=False).last()
            prediction_df, importance = predict_future_scores(feat=features)

        return success_response(
            data={
                "table": table,
                "radar": radar,
                "bar": bar,
                "gap_heatmap": gap_heatmap,
                'raw_df': raw_df.to_dict(orient="records"),
                'importance': importance.tolist(),
                "max_gap_assesor": max_gap_assesor,
                "consistency": consistency_score,
                "prediction": (
                    prediction_df.iloc[0].to_dict()
                    if prediction_df is not None and not prediction_df.empty
                    else None
                    ),
            },
            message="Detail akreditasi berhasil diambil"
        )

    except Exception as e:
        return handle_exception(e)
    
@akreditasi_bp.route("/akreditasi/dashboard/detail/emba", methods=["GET"])
@jwt_required()
def get_dashboard_detail_emba():
    try:
        id_akreditasi = request.args.get("id_akreditasi")

        if not id_akreditasi:
            return error_response("id_akreditasi wajib diisi", 400)
        
        akreditasi_obj = Akreditasi.query.get(id_akreditasi)
        id_qs = akreditasi_obj.id_qs

        detail_data = (
            db.session.query(
                LamEmba.kode_kriteria,
                LamEmba.kriteria,
                LamEmba.q_no,
                LamEmba.bobot,
                LamEmba.id_qs,
                LamEmba.mandatory,
                Jawaban.skor_prodi,
                Jawaban.skor_lpmi,
                Jawaban.skor_assesor,
                )
            .join(Jawaban, (Jawaban.id_qs == LamEmba.id_qs) & (Jawaban.q_no == LamEmba.q_no))
            .filter(Jawaban.id_akreditasi == id_akreditasi)
            .all())
        
        kriteria_map = {}

        for row in detail_data:
            kriteria = row.kode_kriteria
            mandatory = row.mandatory
            skor_prodi = row.skor_prodi or 0
            skor_lpmi = row.skor_lpmi or 0
            skor_assesor = row.skor_assesor or 0
            bobot = row.bobot 
            
            if kriteria not in kriteria_map:
                kriteria_map[kriteria] = {
            "kriteria": kriteria,
            "total_pertanyaan": 0,
            "total_prodi": 0,
            "total_lpmi": 0,
            "total_assesor": 0,
            "max_weight": 0,
            "mandatory_pass": True,
            }
            kriteria_map[kriteria]["total_pertanyaan"] += 1
            kriteria_map[kriteria]["total_prodi"] += skor_prodi
            kriteria_map[kriteria]["total_lpmi"] += skor_lpmi
            kriteria_map[kriteria]["total_assesor"] += skor_assesor
            kriteria_map[kriteria]["max_weight"] += bobot

            if mandatory and skor_assesor != 1:
                kriteria_map[kriteria]["mandatory_pass"] = False
        
        kriteria_table = list(kriteria_map.values())

        radar_data = (
            db.session.query(
                LamEmba.kode_kriteria,
                func.sum(LamEmba.bobot).label("total_weight"),
                func.sum(Jawaban.skor_prodi).label("prodi"),
                func.sum(Jawaban.skor_lpmi).label("lpmi"),
                func.sum(Jawaban.skor_assesor).label("assesor"),
            )
            .join(
                Jawaban,
                (Jawaban.id_qs == LamEmba.id_qs) &
                (Jawaban.q_no == LamEmba.q_no)
            )
            .filter(Jawaban.id_akreditasi == id_akreditasi,
                    )
            .group_by(LamEmba.kode_kriteria)
            .order_by(LamEmba.kode_kriteria)
            .all()
        )

        labels = []
        prodi = []
        lpmi = []
        assesor = []

        for row in radar_data:
            weight = row.total_weight or 1
            labels.append(row.kode_kriteria)
            prodi_val = float(row.prodi or 0)
            lpmi_val = float(row.lpmi or 0)
            assesor_val = float(row.assesor or 0)
            
            prodi.append((prodi_val / weight) * 100 if weight > 0 else 0)
            lpmi.append((lpmi_val / weight) * 100 if weight > 0 else 0)
            assesor.append((assesor_val / weight) * 100 if weight > 0 else 0)

        radar = {
            "labels": labels,
            "datasets": {
                "prodi": prodi,
                "lpmi": lpmi,
                "assesor": assesor
            }
        }

        gap_heatmap = []
        for row in radar_data:
            weight = row.total_weight or 1
            prodi_val = float(row.prodi or 0)
            lpmi_val = float(row.lpmi or 0)
            assesor_val = float(row.assesor or 0)

            gap_heatmap.append({
                "criteria": row.kode_kriteria,
                "prodi_vs_lpmi": round(lpmi_val - prodi_val, 2),
                "lpmi_vs_assesor": round(assesor_val - lpmi_val, 2),
            })

        akreditasi = (
            db.session.query(
                Akreditasi.tahun_berlaku,
                func.sum(Akreditasi.total_skor_prodi),
                func.sum(Akreditasi.total_skor_lpmi),
                func.sum(Akreditasi.total_skor_assesor),
                )
                .filter(
                Akreditasi.id_qs == id_qs,
                Akreditasi.id_prodi == akreditasi_obj.id_prodi
                )
                .group_by(Akreditasi.tahun_berlaku)
                .order_by(cast(func.substr(Akreditasi.tahun_berlaku, 6, 4), Integer).desc())
                .limit(5)
                .all()
                )

        bar = {
            "labels": [r[0] for r in akreditasi],
            "datasets": {
                "prodi": [float(r[1] or 0) for r in akreditasi],
                "lpmi": [float(r[2] or 0) for r in akreditasi],
                "assesor": [float(r[3] or 0) for r in akreditasi],
                }
                }
        
        # raw_df = fetch_data_from_db('emba')
        # prediction_df = None
        
        # if raw_df is not None and not raw_df.empty:
        #     prepared_df = prepare_features(raw_df)
        #     prediction_df = predict_future_scores(prepared_df, major=akreditasi_obj.prodi.kode_prodi)

        prediction_df = predict_future_scores(filtered='emba')

        return success_response(
            data={
                "table": kriteria_table,
                "radar": radar,
                "bar": bar,
                "gap_heatmap": gap_heatmap,
                "prediction": (
                    prediction_df.iloc[0].to_dict()
                    if prediction_df is not None and not prediction_df.empty
                    else None
                    )
            },
            message="Detail akreditasi berhasil diambil"
        )

    except Exception as e:
        return handle_exception(e)
    
@akreditasi_bp.route('/akreditasi', methods=["POST"])
@jwt_required()
@role_required('ADMIN', 'SUPERADMIN')
def add_akreditasi():
    try:
        data = request.get_json()

        required_fields = [
            "tanggal_mulai",
            "tanggal_selesai_prodi",
            "tanggal_selesai_lpmi",
            "nama_akreditasi",
            "tahun_berlaku",
            "id_qs",
            "id_prodi"
        ]

        for field in required_fields:
            if field not in data or not data[field]:
                return error_response(f"{field} wajib diisi", 400)

        akreditasi = Akreditasi(
            tanggal_mulai=datetime.strptime(data["tanggal_mulai"], "%Y-%m-%d"),
            tanggal_selesai_prodi=datetime.strptime(data["tanggal_selesai_prodi"], "%Y-%m-%d"),
            tanggal_selesai_lpmi=datetime.strptime(data["tanggal_selesai_lpmi"], "%Y-%m-%d"),
            nama_akreditasi=data["nama_akreditasi"],
            tahun_berlaku=data["tahun_berlaku"],
            id_qs=data["id_qs"],
            id_prodi=data["id_prodi"]
        )

        db.session.add(akreditasi)
        db.session.commit()

        return success_response(message="Akreditasi berhasil ditambahkan", status_code=201)

    except Exception as e:
        db.session.rollback()
        return handle_exception(e)
    
    
@akreditasi_bp.route('/akreditasi/<string:id>', methods=["PUT"])
@jwt_required()
@role_required('ADMIN', 'SUPERADMIN')
def update_akreditasi(id):
    try:
        data = request.get_json()

        akreditasi = Akreditasi.query.get(id)
        if not akreditasi:
            return error_response("Akreditasi tidak ditemukan", 404)

        akreditasi.tanggal_mulai = datetime.strptime(data["tanggal_mulai"], "%Y-%m-%d")
        akreditasi.tanggal_selesai_prodi = datetime.strptime(data["tanggal_selesai_prodi"], "%Y-%m-%d")
        akreditasi.tanggal_selesai_lpmi = datetime.strptime(data["tanggal_selesai_lpmi"], "%Y-%m-%d")
        akreditasi.nama_akreditasi = data["nama_akreditasi"]
        akreditasi.tahun_berlaku = data["tahun_berlaku"]
        akreditasi.id_qs = data["id_qs"]
        akreditasi.id_prodi = data["id_prodi"]

        db.session.commit()

        return success_response(message="Akreditasi berhasil diperbarui")

    except Exception as e:
        db.session.rollback()
        return handle_exception(e)

@akreditasi_bp.route("/akreditasi/report", methods=["GET"])
@jwt_required()
@role_required('ADMIN', 'SUPERADMIN', 'UPPS', 'LPMI')
def get_report():
    id_lembaga = request.args.get("id_lembaga", type=int)
    tahun_berlaku = request.args.get("tahun_berlaku")

    if not tahun_berlaku:
            return error_response("Year must be filled", 400)
    
    raw_df = fetch_data_from_db(year=tahun_berlaku)

    if raw_df.empty:
        return success_response(message="No data available")
    
    filtered_df = raw_df.copy()
    
    if id_lembaga == 1:
        filtered_df = filtered_df[
        filtered_df["exam"] == "laminfokom"
    ]
    
    elif id_lembaga == 2:
        filtered_df = filtered_df[
        filtered_df["exam"] == "lamemba"
    ]
        
    indicator_df = generate_indicator_table(raw_df)

    bar_df = (
        raw_df
        .groupby(["major", "exam"])
        .agg({
        "jawaban_prodi": "sum",
        "jawaban_lpmi": "sum",
        "jawaban_assessor": "sum"
        })
        .reset_index()
        .rename(columns={
        "jawaban_prodi": "total_prodi",
        "jawaban_lpmi": "total_lpmi",
        "jawaban_assessor": "total_assesor"
        })
        )
    bar_df["LAM"] = bar_df["exam"].replace({
    "laminfokom": "Infokom",
    "lamemba": "Emba"})
    
    bar_df = bar_df.drop(columns=["exam"])

    labels = indicator_df["major"].tolist()

    radar = {
        "labels": labels,
        "datasets": {
            "u": indicator_df["indikator_u"].tolist(),
            "m": indicator_df["indikator_m"].tolist(),
            "bm": indicator_df["indikator_bm"].tolist()
        }
    }
    
    prepared_df =prepare_features(filtered_df)
    features = aggregate_per_exam(prepared_df)

    risk_exam, risk_major = compute_and_combine_risk_metrics(features, year=tahun_berlaku.str.extract(r"(\d{4})")[0] )
    
    return success_response( 
        data={
        "risk_per_major": risk_major.to_dict(orient="records"),
        "bar_data": bar_df.to_dict(orient="records"),
        "indicator_table": indicator_df.to_dict(orient="records"),
        "radar": radar
        },
        message="Report fetched!"
    )