from flask import Blueprint, request
from app import db
from app.models.Jawaban import Jawaban
from app.models.Akreditasi import Akreditasi
from app.models.QuestionList import LamEmba, LamInfokom
from app.models.QuestionSet import QuestionSet
from app.utils.response_handler import success_response, error_response, handle_exception
from app.utils.decorator import role_required
from datetime import datetime
from flask_jwt_extended import jwt_required, get_jwt
from sqlalchemy import func, case, cast, Date, Integer
from datetime import datetime, date

akreditasi_bp = Blueprint("akreditasi", __name__)

@akreditasi_bp.route('/akreditasi', methods=["GET"])
@jwt_required()
def get_akreditasi():
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 5, type=int)

        if page < 1 or per_page < 1:
            return error_response("Page dan per_page harus lebih dari 0", 400)
        
        user = get_jwt()
        role = user.get("role")

        id_qs = request.args.get('id_qs')
        id_prodi = request.args.get('id_prodi')
        # id_lembaga = request.args.get('id_lembaga')
        tahun_berlaku = request.args.get('tahun_berlaku')
        status = request.args.get('status')
        fakultas = request.args.get('fakultas')
        available = request.args.get('available')
        only_null_assesor = request.args.get('only_null_assesor')

        query = Akreditasi.query
        today = date.today()

        if available is not None:
            available = available.lower() == "true"
            if role == "PRODI":
                    query = query.filter(
                        Akreditasi.status == 'In Progress',
                        cast(Akreditasi.tanggal_selesai_prodi, Date) >= today
                    )
            elif role == "LPMI":
                    query = query.filter(
                        Akreditasi.status.in_(['Submitted', 'Validating']),
                        cast(Akreditasi.tanggal_selesai_lpmi, Date) >= today
                    )
            else:
                    query = query.filter(cast(Akreditasi.tanggal_selesai_lpmi, Date) >= today)
        
        if only_null_assesor:
            query = query.filter(Akreditasi.tanggal_validasi.is_(None))

        if fakultas:
            query = query.filter(Akreditasi.prodi.has(fakultas=fakultas))

        if tahun_berlaku:
            query = query.filter(Akreditasi.tahun_berlaku == tahun_berlaku)

        if status:
            status_list = [s.strip() for s in status.split(",")]
            query = query.filter(Akreditasi.status.in_(status_list))

        if id_qs:
            query = query.filter(Akreditasi.id_qs == id_qs)

        if id_prodi:
            query = query.filter(Akreditasi.id_prodi == id_prodi)

        # if tanggal_mulai:
        #     try:
        #         tgl = datetime.fromisoformat(tanggal_mulai)
        #         query = query.filter(Akreditasi.tanggal_mulai >= tgl)
        #     except ValueError:
        #         return error_response("Format tanggal_mulai tidak valid", 400)

        # if tanggal_selesai:
        #     try:
        #         tgl = datetime.fromisoformat(tanggal_selesai)
        #         query = query.filter(Akreditasi.tanggal_selesai <= tgl)
        #     except ValueError:
        #         return error_response("Format tanggal_selesai tidak valid", 400)

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
            elif role == "ADMIN" or role == "SUPERADMIN":
                if only_null_assesor is not None:
                    only_null_assesor = only_null_assesor.lower() == "true"
                    if only_null_assesor:
                        progress = a.progress_assesor
                        tanggal_selesai = a.tanggal_selesai_lpmi
                elif a.progress_prodi != 100:
                     progress = a.progress_prodi
                     tanggal_selesai = a.tanggal_selesai_prodi
                else:
                    progress = a.progress_lpmi
                    tanggal_selesai = a.tanggal_selesai_lpmi

            results.append({
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
            })

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
            
        query = query.filter(Akreditasi.status != "In Progress")
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

    for row in detail_data:
        total_questions += 1
        bobot = row.bobot
        kriteria = row.kode_kriteria
        skor_prodi = row.skor_prodi or 0
        skor_lpmi = row.skor_lpmi or 0
        skor_assesor = row.skor_assesor or 0

        detail_q = {
        "q_no": row.q_no,
        "kode_kriteria": kriteria,
        "max_weight": bobot,
        "skor_prodi": skor_prodi,
        "skor_lpmi": skor_lpmi,

        "skor_assesor": skor_assesor,}

        # GROUP BY BOBOT (TABLE)
        if bobot not in bobot_map:
            bobot_map[bobot] = {
            "weight": bobot,
            "questions": 0,
            "max_weight": 0,
            "prodi": 0,
            "lpmi": 0,
            "assesor": 0,
            "detail_question": []}
        
        bobot_map[bobot]["questions"] += 1
        bobot_map[bobot]["max_weight"] += bobot
        bobot_map[bobot]["prodi"] += skor_prodi
        bobot_map[bobot]["lpmi"] += skor_lpmi
        bobot_map[bobot]["assesor"] += skor_assesor
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
            "detail": []}

        kriteria_map[kriteria]["total_pertanyaan"] += 1
        kriteria_map[kriteria]["total_prodi"] += skor_prodi
        kriteria_map[kriteria]["total_lpmi"] += skor_lpmi
        kriteria_map[kriteria]["total_assesor"] += skor_assesor
        kriteria_map[kriteria]["max_weight"] += bobot
        
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
                found = True
                break
        
        if not found:
            detail_list.append({
                "elemen_kriteria": elemen,
                "total_pertanyaan": 1,
                "prodi": skor_prodi,
                "lpmi": skor_lpmi,
                "assesor": skor_assesor,
                "weight": bobot
                })

    for bobot, val in bobot_map.items():
        val["assesor_lpmi"] = val["assesor"] - val["lpmi"]
        table.append(val)
        
    table.sort(key=lambda x: x["weight"], reverse=True)

    kriteria_table = list(kriteria_map.values())

    return success_response(
        data={
            "detail": table,
            "kriteria_detail": kriteria_table,
            "total_questions": total_questions,
            "nama_pengisi": akreditasi.pengisi.username if akreditasi.pengisi else None,
            "nama_validator": akreditasi.validator.username if akreditasi.validator else None,
            "total_prodi": akreditasi.total_skor_prodi,
            "total_lpmi": akreditasi.total_skor_lpmi,
            "total_assesor": akreditasi.total_skor_assesor,
            "tanggal_pengisian": akreditasi.tanggal_pengisian,
            "tanggal_validasi": akreditasi.tanggal_validasi,
            "tanggal_review": akreditasi.tanggal_review,
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
        skor_prodi = row.skor_prodi or 0
        skor_lpmi = row.skor_lpmi or 0
        skor_assesor = row.skor_assesor or 0
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
            "detail": []}

        kriteria_map[kriteria]["total_pertanyaan"] += 1
        kriteria_map[kriteria]["total_prodi"] += skor_prodi
        kriteria_map[kriteria]["total_lpmi"] += skor_lpmi
        kriteria_map[kriteria]["total_assesor"] += skor_assesor
        kriteria_map[kriteria]["max_weight"] += bobot
        
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

    return success_response(
        data={
            "detail": table,
            "kriteria_detail": kriteria_table,
            "total_questions": total_questions,
            "nama_pengisi": akreditasi.pengisi.username if akreditasi.pengisi else None,
            "nama_validator": akreditasi.validator.username if akreditasi.validator else None,
            "total_prodi": akreditasi.total_skor_prodi,
            "total_lpmi": akreditasi.total_skor_lpmi,
            "total_assesor": akreditasi.total_skor_assesor,
            "tanggal_pengisian": akreditasi.tanggal_pengisian,
            "tanggal_validasi": akreditasi.tanggal_validasi,
            "tanggal_review": akreditasi.tanggal_review,
            'max_points': total_max_point
        },
        message="Weight summary berhasil diambil"
    )

#Perlu get id akreditasi
    
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
                    Akreditasi.status == 'Reviewed'
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

        for row in detail_data:
            bobot = row.bobot
            skor_prodi = row.skor_prodi or 0
            skor_lpmi = row.skor_lpmi or 0
            skor_assesor = row.skor_assesor or 0

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
        for val in bobot_map.values():
            total_q = val["total_questions"]
            bobot = val["weight"]
            last = last_map.get(bobot, {})

            last_avg_lpmi = (
                last.get("lpmi", 0) / last.get("total", 1)
                if last else None
                )
            
            last_avg_assesor = (
                last.get("assesor", 0) / last.get("total", 1)
                if last else None
                )

            avg_prodi = val["prodi"] / total_q if total_q else 0
            avg_lpmi = val["lpmi"] / total_q if total_q else 0
            avg_assesor = val["assesor"] / total_q if total_q else 0

            table.append({
                "weight": bobot,
                "total_questions": total_q,

                "prodi": avg_prodi,
                "lpmi": avg_lpmi,
                "assesor": avg_assesor,

                "this_to_assesor": avg_lpmi - avg_assesor,
                "this_to_max": bobot - avg_lpmi,

                "last_to_assesor": (
                    last_avg_lpmi - last_avg_assesor
                    if last else None
                    ),
                "last_to_max": (
                    bobot - last_avg_lpmi
                    if last else None
                    ),

                "percentage": (avg_assesor / bobot) * 100 if bobot else 0,
            })

        table.sort(key=lambda x: x["weight"], reverse=True)

        radar_data = (
            db.session.query(
                LamInfokom.kode_kriteria,
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
            .group_by(LamInfokom.kode_kriteria)
            .order_by(LamInfokom.kode_kriteria)
            .all()
        )

        labels = []
        prodi = []
        lpmi = []
        assesor = []

        for row in radar_data:
            weight = row.total_weight or 1
            labels.append(row.kode_kriteria)
            prodi.append((row.prodi or 0) / weight * 100)
            lpmi.append((row.lpmi or 0) / weight * 100)
            assesor.append((row.assesor or 0) / weight * 100)

        radar = {
            "labels": labels,
            "datasets": {
                "prodi": prodi,
                "lpmi": lpmi,
                "assesor": assesor
            }
        }

        akreditasi = (
            db.session.query(
                Akreditasi.tahun_berlaku,
                func.sum(Akreditasi.total_skor_prodi),
                func.sum(Akreditasi.total_skor_lpmi),
                func.sum(Akreditasi.total_skor_assesor),
                )
                .filter(
                Akreditasi.id_qs == id_qs,
                Akreditasi.status == 'Reviewed'
                )
                .group_by(Akreditasi.tahun_berlaku)
                .order_by(cast(func.substr(Akreditasi.tahun_berlaku, 6, 4), Integer).desc())
                .limit(5)
                .all()
                )

        bar = {
            "labels": [r[0] for r in akreditasi],
            "datasets": {
                "prodi": [r[1] or 0 for r in akreditasi],
                "lpmi": [r[2] or 0 for r in akreditasi],
                "assesor": [r[3] or 0 for r in akreditasi],
                }
                }

        return success_response(
            data={
                "table": table,
                "radar": radar,
                "bar": bar,
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
        
        # year_data = (
        #     db.session.query(
        #         Akreditasi.id_akreditasi,
        #         Akreditasi.tahun_berlaku
        #         )
        #         .filter(
        #             Akreditasi.id_qs == id_qs,
        #             Akreditasi.status == 'Reviewed'
        #             )
        #             .order_by(
        #                 cast(func.substr(Akreditasi.tahun_berlaku, 6, 4), Integer).asc()
        #                 )
        #                 .all()
        #                 )
        
        # current_index = None
        # for i, row in enumerate(year_data):
        #     if row.id_akreditasi == id_akreditasi:
        #         current_index = i
        #         break

        # last_akreditasi_id = None
        # if current_index is not None and current_index > 0:
        #     last_akreditasi_id = year_data[current_index - 1].id_akreditasi
        
        # last_detail_data = []
        
        # if last_akreditasi_id:
        #     last_detail_data = (
        #         db.session.query(
        #             LamEmba.bobot,
        #             Jawaban.skor_lpmi,
        #             Jawaban.skor_assesor,
        #             )
        #         .join(
        #             Jawaban,
        #             (Jawaban.id_qs == LamEmba.id_qs) &
        #             (Jawaban.q_no == LamEmba.q_no)
        #             )
        #         .filter(Jawaban.id_akreditasi == last_akreditasi_id)
        #         .all()
        #         )

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
            .filter(Jawaban.id_akreditasi == id_akreditasi)
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
            prodi.append((row.prodi or 0) / weight * 100)
            lpmi.append((row.lpmi or 0) / weight * 100)
            assesor.append((row.assesor or 0) / weight * 100)

        radar = {
            "labels": labels,
            "datasets": {
                "prodi": prodi,
                "lpmi": lpmi,
                "assesor": assesor
            }
        }

        akreditasi = (
            db.session.query(
                Akreditasi.tahun_berlaku,
                func.sum(Akreditasi.total_skor_prodi),
                func.sum(Akreditasi.total_skor_lpmi),
                func.sum(Akreditasi.total_skor_assesor),
                )
                .filter(
                Akreditasi.id_qs == id_qs,
                Akreditasi.status == 'Reviewed'
                )
                .group_by(Akreditasi.tahun_berlaku)
                .order_by(cast(func.substr(Akreditasi.tahun_berlaku, 6, 4), Integer).desc())
                .limit(5)
                .all()
                )

        bar = {
            "labels": [r[0] for r in akreditasi],
            "datasets": {
                "prodi": [r[1] or 0 for r in akreditasi],
                "lpmi": [r[2] or 0 for r in akreditasi],
                "assesor": [r[3] or 0 for r in akreditasi],
                }
                }

        return success_response(
            data={
                "table": kriteria_table,
                "radar": radar,
                "bar": bar,
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
            "tanggal_selesai",
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
            tanggal_selesai_prodi=datetime.strptime(data["tanggal_selesai"], "%Y-%m-%d"),
            tanggal_selesai_lpmi=datetime.strptime(data["tanggal_selesai"], "%Y-%m-%d"),
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
        akreditasi.tanggal_selesai = datetime.strptime(data["tanggal_selesai"], "%Y-%m-%d")
        akreditasi.nama_akreditasi = data["nama_akreditasi"]
        akreditasi.tahun_berlaku = data["tahun_berlaku"]
        akreditasi.id_qs = data["id_qs"]
        akreditasi.id_prodi = data["id_prodi"]

        db.session.commit()

        return success_response(message="Akreditasi berhasil diperbarui")

    except Exception as e:
        db.session.rollback()
        return handle_exception(e)