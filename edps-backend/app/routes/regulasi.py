# from flask import Blueprint, request
# from app import db
# from app.models import Regulasi, VersiRegulasi, Prodi
# from app.utils.response_handler import success_response, error_response, handle_exception
# from app.utils.decorator import role_required
# from flask_jwt_extended import jwt_required

# regulasi_bp = Blueprint("regulasi", __name__)

# @regulasi_bp.route("/regulasi", methods=["POST"])
# @jwt_required()
# @role_required('ADMIN', 'SUPERADMIN')
# def add_regulasi():
#     try:
#         data = request.get_json()
        
#         required_fields = ["nama_regulasi", "deskripsi_regulasi"]
#         for field in required_fields:
#             if field not in data or not data[field]:
#                 return error_response(f"Field '{field}' wajib diisi", 400)
        
#         regulasi = Regulasi(
#             nama_regulasi=data["nama_regulasi"],
#             deskripsi_regulasi=data["deskripsi_regulasi"],
#         )
        
#         db.session.add(regulasi)
#         db.session.commit()

#         return success_response(
#             data={
#                 "id_regulasi": regulasi.id_regulasi,
#                 "nama_regulasi": regulasi.nama_regulasi,
#                 "deskripsi_regulasi": regulasi.deskripsi_regulasi,
#             },
#             message="Regulasi berhasil ditambahkan",
#             status_code=201
#         )

#     except Exception as e:
#         db.session.rollback()
#         return handle_exception(e)

# @regulasi_bp.route("/versi-regulasi", methods=["GET"])
# def get_all_versi_regulasi():
#     try:
#         id_prodi = request.args.get("id_prodi")

#         if not id_prodi:
#             return error_response("Parameter 'id_prodi' wajib dikirim", 400)

#         # Get prodi data
#         prodi = Prodi.query.get(id_prodi)
#         if not prodi:
#             return error_response(f"Prodi dengan id {id_prodi} tidak ditemukan", 404)

#         # Get regulasi_ids from prodi
#         if not prodi.regulasi_ids:
#             return success_response(
#                 data=[], 
#                 message="Tidak ada regulasi yang terdaftar untuk prodi ini"
#             )

#         query = VersiRegulasi.query.filter(
#             VersiRegulasi.status_aktif.is_(True),
#             VersiRegulasi.id_regulasi.in_(prodi.regulasi_ids)
#         ).order_by(VersiRegulasi.versi_regulasi.desc())

#         versi_list = query.all()

#         results = []
#         for versi in versi_list:
#             results.append({
#                 "id_versi": versi.id_versi,
#                 "versi_regulasi": versi.versi_regulasi,
#                 "tahun_berlaku": versi.tahun_berlaku,
#                 "id_regulasi": versi.id_regulasi,
#                 "nama_regulasi": versi.regulasi.nama_regulasi if versi.regulasi else None,
#                 "total_max_bobot": versi.total_max_bobot
#             })

#         if not results:
#             return success_response(
#                 data=[], 
#                 message="Tidak ada versi regulasi aktif untuk prodi ini"
#             )

#         return success_response(
#             data=results,
#             message="Data versi regulasi berhasil diambil"
#         )

#     except Exception as e:
#         return handle_exception(e)

# # @regulasi_bp.route("/versi-regulasi", methods=["GET"])
# # def get_all_versi_regulasi():
# #     try:
# #         id_regulasi_list = request.args.getlist("id_regulasi")

# #         if not id_regulasi_list:
# #             return error_response("Parameter 'id_regulasi' wajib dikirim", 400)

# #         valid_regulasi = Regulasi.query.filter(Regulasi.id_regulasi.in_(id_regulasi_list)).all()
# #         valid_ids = {r.id_regulasi for r in valid_regulasi}
# #         invalid_ids = [rid for rid in id_regulasi_list if rid not in valid_ids]

# #         if invalid_ids:
# #             return error_response(f"Regulasi dengan id {invalid_ids} tidak ditemukan", 404)

# #         query = VersiRegulasi.query.filter(
# #             VersiRegulasi.status_aktif.is_(True),
# #             VersiRegulasi.id_regulasi.in_(id_regulasi_list)
# #         ).order_by(VersiRegulasi.versi_regulasi.desc())

# #         versi_list = query.all()

# #         results = []
# #         for versi in versi_list:
# #             results.append({
# #                 "id_versi": versi.id_versi,
# #                 "versi_regulasi": versi.versi_regulasi,
# #                 "tahun_berlaku": versi.tahun_berlaku,
# #                 "id_regulasi": versi.id_regulasi,
# #                 "nama_regulasi": versi.regulasi.nama_regulasi if versi.regulasi else None,
# #             })

# #         if not results:
# #             return success_response(data=[], message="Tidak ada versi regulasi aktif untuk regulasi yang diberikan")

# #         return success_response(
# #             data=results,
# #             message="Data versi regulasi aktif berhasil diambil untuk regulasi yang diberikan"
# #         )

# #     except Exception as e:
# #         return handle_exception(e)