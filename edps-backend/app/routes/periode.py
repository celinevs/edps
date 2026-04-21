# from flask import Blueprint, request
# from app import db
# from app.models import Periode, Regulasi, VersiRegulasi, Pertanyaan, JawabanUser
# from app.utils.response_handler import success_response, error_response, handle_exception
# from app.utils.decorator import role_required
# from datetime import datetime
# from flask_jwt_extended import jwt_required
# from sqlalchemy import func, case

# periode_bp = Blueprint("periode", __name__)

# @periode_bp.route('/periode', methods=["GET"])
# @jwt_required()
# def get_periode():
#     try:
#         page = request.args.get('page', 1, type=int)
#         per_page = request.args.get('per_page', 5, type=int)
#         if page < 1 or per_page < 1:
#             return error_response("Page dan per_page harus lebih dari 0", 400)
        
#         id_versi = request.args.get('id_versi')
#         tanggal_mulai = request.args.get('tanggal_mulai')
#         tanggal_selesai = request.args.get('tanggal_selesai')
#         status = request.args.get('status')
#         tahun_berlaku = request.args.get('tahun_berlaku')
#         fakultas = request.args.get('fakultas')

#         query = Periode.query
#         if fakultas:
#             query = query.filter(Periode.prodi.has(fakultas=fakultas))
#         if tahun_berlaku:
#             query = query.filter(Periode.tahun_berlaku == tahun_berlaku)
#         if status:
#             status_list = [s.strip() for s in status.split(",")]
#             query = query.filter(Periode.status.in_(status_list))
#         if id_versi:
#             query = query.filter(Periode.id_versi == id_versi)

#         if tanggal_mulai:
#             try:
#                 tgl = datetime.fromisoformat(tanggal_mulai)
#                 query = query.filter(Periode.tanggal_mulai >= tgl)
#             except ValueError:
#                 return error_response("Format tanggal_mulai tidak valid (gunakan ISO format: YYYY-MM-DD)", 400)
#         if tanggal_selesai:
#             try:
#                 tgl = datetime.fromisoformat(tanggal_selesai)
#                 query = query.filter(Periode.tanggal_selesai <= tgl)
#             except ValueError:
#                 return error_response("Format tanggal_selesai tidak valid (gunakan ISO format: YYYY-MM-DD)", 400)
            
#         summary = query.with_entities(
#             func.sum(case((Periode.status == 'In Progress', 1), else_=0)).label('in_progress'),
#             func.sum(case((Periode.status == 'Submitted', 1), else_=0)).label('awaiting_validation'),
#             func.sum(case((Periode.status == 'Validated', 1), else_=0)).label('validation_complete'),
#             func.sum(case((Periode.status == 'Reviewed', 1), else_=0)).label('assessed')
#             ).first()
#         summary_response = {
#             "in_progress": summary.in_progress or 0,
#             "awaiting_validation": summary.awaiting_validation or 0,
#             "validation_complete": summary.validation_complete or 0,
#             "assessed": summary.assessed or 0
#             }
#         pagination = query.paginate(page=page, per_page=per_page, error_out=False)

#         results = []
#         for p in pagination.items:
#             total_max_bobot = p.versi_regulasi.total_max_bobot if p.versi_regulasi else None

#             versi_info = None
#             regulasi_info = None
#             prodi_info = None
#             if p.prodi:
#                 prodi_info = {
#                     "id_prodi": p.prodi.id_prodi,
#                     "kode_prodi": p.prodi.kode_prodi,
#                     "nama_prodi": p.prodi.nama_prodi,
#                     "fakultas": p.prodi.fakultas
#                 }
#             if p.versi_regulasi:
#                 versi_info = {
#                     "id_versi": p.versi_regulasi.id_versi,
#                     "versi_regulasi": p.versi_regulasi.versi_regulasi,
#                     "tahun_berlaku": p.versi_regulasi.tahun_berlaku,
#                     "total_max_bobot": p.versi_regulasi.total_max_bobot
#                 }
#                 if p.versi_regulasi.regulasi:
#                     regulasi_info = {
#                         "id_regulasi": p.versi_regulasi.regulasi.id_regulasi,
#                         "nama_regulasi": p.versi_regulasi.regulasi.nama_regulasi
#                     }

#             periode_data = {
#                 "id_periode": p.id_periode,
#                 "nama_periode": p.nama_periode,
#                 "status": p.status,
#                 "total_skor_lpmi": p.total_skor_lpmi,
#                 "total_skor_prodi": p.total_skor_prodi,
#                 "total_skor_assesor": p.total_skor_assesor,
#                 "total_max_bobot": total_max_bobot,
#                 "versi": versi_info,
#                 "regulasi": regulasi_info,
#                 "prodi": prodi_info,
#             }

#             if p.tanggal_validasi:
#                 periode_data["tanggal_validasi"] = p.tanggal_validasi
#             if p.tanggal_mulai:
#                 periode_data["tanggal_mulai"] = p.tanggal_mulai
#             if p.tanggal_selesai:
#                 periode_data["tanggal_selesai"] = p.tanggal_selesai

#             results.append(periode_data)

#         return success_response(
#             data={
#                 "results": results,
#                 "totalCount": pagination.total,
#                 "currentPage": pagination.page,
#                 "pageSize": pagination.per_page,
#                 "totalPages": pagination.pages,
#                 "summary": summary_response
#             },
#             message="Data periode berhasil diambil",
#         )

#     except Exception as e:
#         return handle_exception(e)

# @periode_bp.route("/periode/tahun-berlaku", methods=["GET"])
# def get_unique_tahun_berlaku():
#     result = (
#         db.session.query(Periode.tahun_berlaku)
#         .distinct()
#         .order_by(Periode.tahun_berlaku.desc())
#         .all()
#     )

#     data = [row[0] for row in result]
#     return success_response(data=data, message="Data tahun berlaku berhasil diambil")

# @periode_bp.route("/periode/<id_periode>/weight-summary", methods=["GET"])
# @jwt_required()
# def get_weight_summary(id_periode):
#     data = (
#         db.session.query(
#             Pertanyaan.bobot,
#             func.count(Pertanyaan.id_pertanyaan).label("total_q"),
#             func.sum(JawabanUser.skor_prodi).label("prodi"),
#             func.sum(JawabanUser.skor_lpmi).label("lpmi"),
#             func.sum(JawabanUser.skor_assesor).label("assessor"),
#         )
#         .join(JawabanUser, JawabanUser.id_pertanyaan == Pertanyaan.id_pertanyaan)
#         .filter(JawabanUser.id_periode == id_periode)
#         .group_by(Pertanyaan.bobot)
#         .all()
#     )

#     versi = (
#         db.session.query(VersiRegulasi)
#         .join(Periode, Periode.id_versi == VersiRegulasi.id_versi)
#         .filter(Periode.id_periode == id_periode)
#         .first()
#     )

#     periode = Periode.query.get(id_periode)
#     if not periode:
#             return error_response(f"Periode dengan id {id_periode} tidak ditemukan", 404)

#     max_points = versi.total_max_bobot if versi else 0

#     table = []
#     total_questions = 0

#     for row in data:
#         bobot = row.bobot
#         jumlah_q = row.total_q or 0
#         prodi = row.prodi or 0
#         lpmi = row.lpmi or 0
#         assesor = row.assessor or 0

#         table.append({
#             "weight": bobot,
#             "questions": jumlah_q,
#             "max_weight": bobot * jumlah_q,
#             "prodi": prodi,
#             "lpmi": lpmi,
#             "assesor": assesor,
#             "assesor_lpmi": assesor - lpmi
#             # GAP? dari assesor atau lpmi?
#         })

#         total_questions += jumlah_q

#     response = {
#         "detail": table,
#         "total_questions": total_questions,
#         "max_points": max_points,
#         "nama_pengisi": periode.pengisi.username if periode.pengisi else None,
#         "nama_validator": periode.validator.username if periode.validator else None,
#         "total_prodi": periode.total_skor_prodi,
#         "total_lpmi": periode.total_skor_lpmi,
#         "total_assesor": periode.total_skor_assesor,
#         "tanggal_pengisian": periode.tanggal_pengisian,
#         "tanggal_validasi": periode.tanggal_validasi,
#         "tanggal_review": periode.tanggal_review
#     }

#     return success_response(data=response, message='Weight summary berhasil diambil')
    


# @periode_bp.route('/periode', methods=["POST"])
# @jwt_required()
# @role_required('ADMIN', 'SUPERADMIN')
# def add_periode():
#     try:
#         data = request.get_json()
        
#         required_fields = ["tanggal_mulai", "tanggal_selesai", "tanggal_kadaluarsa", "nama_periode", "tahun_berlaku", "id_versi", "id_prodi"]
#         for field in required_fields:
#             if field not in data or not data[field]:
#                 return error_response(f"Field '{field}' wajib diisi", 400)
        
#         versi = VersiRegulasi.query.get(data["id_versi"])
#         if not versi:
#             return error_response(f"Versi regulasi dengan id {data['id_versi']} tidak ditemukan", 404)
        
#         try:
#             tanggal_mulai = datetime.strptime(data["tanggal_mulai"], "%Y-%m-%d")
#             tanggal_selesai = datetime.strptime(data["tanggal_selesai"], "%Y-%m-%d")
#             tanggal_kadaluarsa = datetime.strptime(data["tanggal_kadaluarsa"], "%Y-%m-%d")
#         except ValueError:
#             return error_response("Format tanggal tidak valid. Gunakan format YYYY-MM-DD", 400)
            
#         if tanggal_mulai >= tanggal_selesai:
#             return error_response("Tanggal mulai harus lebih awal dari tanggal selesai", 400)
        
#         periode = Periode(
#             tanggal_mulai=tanggal_mulai,
#             tanggal_selesai=tanggal_selesai,
#             tanggal_kadaluarsa=tanggal_kadaluarsa,
#             tahun_berlaku= data["tahun_berlaku"],
#             nama_periode=data["nama_periode"],
#             id_versi=data["id_versi"],
#             id_prodi = data['id_prodi'],
#         )
        
#         db.session.add(periode)
#         db.session.commit()

#         return success_response(
#             data= None,
#             message="Periode berhasil ditambahkan",
#             status_code=201
#         )

#     except Exception as e:
#         db.session.rollback()
#         return handle_exception(e)
    
# @periode_bp.route('/periode/<string:id_periode>', methods=["PUT"])
# @jwt_required()
# @role_required('ADMIN', 'SUPERADMIN')
# def update_periode(id_periode):
#     try:
#         data = request.get_json()

#         periode = Periode.query.get(id_periode)
#         if not periode:
#             return error_response("Periode tidak ditemukan", 404)

#         today = datetime.utcnow().date()
#         if periode.tanggal_kadaluarsa.date() < today:
#             return error_response("Periode sudah kadaluarsa dan tidak dapat diedit", 400)
        
#         required_fields = ["tanggal_mulai", "tanggal_selesai", "tanggal_kadaluarsa", "nama_periode", "tahun_berlaku", "id_versi", "id_prodi"]
#         for field in required_fields:
#             if field not in data or not data[field]:
#                 return error_response(f"Field '{field}' wajib diisi", 400)

#         versi = VersiRegulasi.query.get(data["id_versi"])
#         if not versi:
#             return error_response(f"Versi regulasi dengan id {data['id_versi']} tidak ditemukan", 404)

#         try:
#             tanggal_mulai = datetime.strptime(data["tanggal_mulai"], "%Y-%m-%d")
#             tanggal_selesai = datetime.strptime(data["tanggal_selesai"], "%Y-%m-%d")
#             tanggal_kadaluarsa = datetime.strptime(data["tanggal_kadaluarsa"], "%Y-%m-%d")
#         except ValueError:
#             return error_response("Format tanggal tidak valid. Gunakan format YYYY-MM-DD", 400)

#         if tanggal_mulai >= tanggal_selesai:
#             return error_response("Tanggal mulai harus lebih awal dari tanggal selesai", 400)

#         # Update field
#         periode.tanggal_mulai = tanggal_mulai
#         periode.tanggal_selesai = tanggal_selesai
#         periode.tanggal_kadaluarsa = tanggal_kadaluarsa
#         periode.nama_periode = data["nama_periode"]
#         periode.id_versi = data["id_versi"]
#         periode.id_prodi = data["id_prodi"]

#         db.session.commit()

#         return success_response(
#             data=None,
#             message="Periode berhasil diperbarui",
#             status_code=200
#         )

#     except Exception as e:
#         db.session.rollback()
#         return handle_exception(e)