from flask import Blueprint, request, send_file, make_response
# from app.models import db, Akreditasi, JawabanUser, Pertanyaan, IndikatorJawaban, UploadFile
from app import db
from app.models.Jawaban import Jawaban, UploadFile, EmbaDosen
from app.models.Akreditasi import Akreditasi
from app.models.QuestionList import LamEmba, LamInfokom
from app.utils.response_handler import success_response, error_response, handle_exception
from app.utils.decorator import role_required
from datetime import datetime
import os
from werkzeug.utils import secure_filename
import mimetypes
from flask_cors import cross_origin
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt

UPLOAD_FOLDER = os.getenv("UPLOAD_FOLDER", "/app/uploads")

jawaban_bp = Blueprint("jawaban", __name__)

@jawaban_bp.route("/jawaban-user/<id_akreditasi>", methods=["GET"])
@jwt_required()
def get_jawaban_user_by_akreditasi(id_akreditasi):
    try:
        # Get current user role
        jwt_data = get_jwt()
        user_role = jwt_data.get('role')
        
        akreditasi = Akreditasi.query.get(id_akreditasi)
        if not akreditasi:
            return error_response(f"Akreditasi dengan id {id_akreditasi} tidak ditemukan", 404)
        
        is_infokom = akreditasi.question_set.id_lembaga == 1
        
        jawaban_list = Jawaban.query.filter_by(id_akreditasi=id_akreditasi).all()
        
        emba_dosen_data = None
        if not is_infokom:
            emba_dosen_list = EmbaDosen.query.filter_by(id_akreditasi=id_akreditasi).all()
            emba_dosen_data = []
            for dosen in emba_dosen_list:
                # Filter based on role and status
                should_include = False
                
                # PRODI: show own data, plus LPMI if status allows, plus ASSESOR if Reviewed
                if user_role == 'PRODI':
                    if dosen.user_role == 'PRODI':
                        should_include = True
                    elif dosen.user_role == 'LPMI' and akreditasi.status in ['Validated', 'Reviewed']:
                        should_include = True
                    elif dosen.user_role == 'ASSESOR' and akreditasi.status == 'Reviewed':
                        should_include = True
                
                # LPMI: show PRODI and own data
                elif user_role == 'LPMI':
                    if dosen.user_role in ['PRODI', 'LPMI']:
                        should_include = True
                    elif dosen.user_role == 'ASSESOR' and akreditasi.status == 'Reviewed':
                        should_include = True
                
                # ASSESOR or SUPERADMIN: show all data
                elif user_role in ['ASSESOR', 'SUPERADMIN']:
                    should_include = True
                
                if should_include:
                    dosen_dict = dosen.to_dict() if hasattr(dosen, 'to_dict') else {
                        "id_jawaban_dosen": dosen.id_jawaban_dosen,
                        "user_role": dosen.user_role,
                        "dosen_total": dosen.dosen_total,
                        "dosen_tetap": dosen.dosen_tetap,
                        "dosen_doktor": dosen.dosen_doktor,
                        "dosen_magister": dosen.dosen_magister,
                        "dosen_guru_besar": dosen.dosen_guru_besar,
                        "dosen_lektor_kepala": dosen.dosen_lektor_kepala,
                        "dosen_lektor": dosen.dosen_lektor,
                        "dosen_publikasi": dosen.dosen_publikasi,
                        "dosen_sertifikat": dosen.dosen_sertifikat,
                    }
                    emba_dosen_data.append(dosen_dict)
        else:
            print("DEBUG: Skipping EmbaDosen because this is INFOKOM (id_lembaga=1)")

        if not jawaban_list:
            return success_response(
                data={
                    "jumlah_jawaban": 0,
                    "jawaban": [],
                    "emba_dosen": emba_dosen_data if not is_infokom else None,
                    "evaluasi_integrasi": akreditasi.evaluasi_integrasi,
                    "rekomendasi_ak": akreditasi.rekomendasi_ak,
                    "catatan_assesor": akreditasi.catatan_assesor
                },
                message="Tidak ada jawaban dalam Akreditasi ini"
            )

        results = []
        for j in jawaban_list:
            files = []
            if j.uploads:
                for f in j.uploads:
                    files.append({
                        "id_file": f.id_file,
                        "file_name": f.file_name,
                    })

            jawaban_item = {
                "id_jawaban": j.id_jawaban,
                "q_no": j.q_no,
                "files": files
            }
            
            # Case 1: User is PRODI - show only prodi data
            if user_role == 'PRODI':
                jawaban_item.update({
                    "jawaban_prodi": j.jawaban_prodi,
                    "skor_prodi": j.skor_prodi,
                })
                # Only show LPMI data if status is Validated or Reviewed
                if akreditasi.status in ['Validated', 'Reviewed']:
                    jawaban_item.update({
                        "jawaban_lpmi": j.jawaban_lpmi,
                        "skor_lpmi": j.skor_lpmi,
                        "note_lpmi": j.note_lpmi,
                    })
                # Only show ASSESOR data if status is Reviewed
                if akreditasi.status == 'Reviewed':
                    jawaban_item.update({
                        "jawaban_assesor": j.jawaban_assesor,
                        "skor_assesor": j.skor_assesor,
                        "note_assesor": j.note_assesor,
                    })
            
            # Case 2: User is LPMI - show prodi and lpmi data
            elif user_role == 'LPMI':
                jawaban_item.update({
                    "jawaban_prodi": j.jawaban_prodi,
                    "skor_prodi": j.skor_prodi,
                    "jawaban_lpmi": j.jawaban_lpmi,
                    "skor_lpmi": j.skor_lpmi,
                    "note_lpmi": j.note_lpmi,
                })
                # Also show ASSESOR data if status is Reviewed
                if akreditasi.status == 'Reviewed':
                    jawaban_item.update({
                        "jawaban_assesor": j.jawaban_assesor,
                        "skor_assesor": j.skor_assesor,
                        "note_assesor": j.note_assesor,
                    })
            
            # Case 3: User is ADMIN - show all data
            elif user_role == 'ADMIN' or user_role == 'UPPS':
                jawaban_item.update({
                    "jawaban_prodi": j.jawaban_prodi,
                    "skor_prodi": j.skor_prodi,
                    "jawaban_lpmi": j.jawaban_lpmi,
                    "skor_lpmi": j.skor_lpmi,
                    "note_lpmi": j.note_lpmi,
                    "jawaban_assesor": j.jawaban_assesor,
                    "skor_assesor": j.skor_assesor,
                    "note_assesor": j.note_assesor,
                })
            
            # Case 4: User is SUPERADMIN - show all data regardless of status
            elif user_role == 'SUPERADMIN':
                jawaban_item.update({
                    "jawaban_prodi": j.jawaban_prodi,
                    "skor_prodi": j.skor_prodi,
                    "jawaban_lpmi": j.jawaban_lpmi,
                    "skor_lpmi": j.skor_lpmi,
                    "note_lpmi": j.note_lpmi,
                    "jawaban_assesor": j.jawaban_assesor,
                    "skor_assesor": j.skor_assesor,
                    "note_assesor": j.note_assesor,
                })
            
            results.append(jawaban_item)

        return success_response(
            data={
                "jumlah_jawaban": len(results),
                "jawaban": results,
                "emba_dosen": emba_dosen_data if not is_infokom else None,
                "evaluasi_integrasi": akreditasi.evaluasi_integrasi,
                "rekomendasi_ak": akreditasi.rekomendasi_ak,
                "catatan_assesor": akreditasi.catatan_assesor
            },
            message="Data jawaban berhasil diambil"
        )

    except Exception as e:
        return handle_exception(e)

@jawaban_bp.route("/jawaban-user", methods=["POST"])
@jwt_required()
@role_required('PRODI', 'SUPERADMIN')
def saved_submit_jawaban():
    try:
        data = request.get_json()

        id_akreditasi = data.get("id_akreditasi")
        id_qs = data.get("id_qs")
        jawaban_list = data.get("jawaban", [])
        is_submit = data.get("is_submit", False)
        dosen = data.get('dosen')

        if not id_akreditasi:
            return error_response("id_akreditasi wajib dikirim", 400)

        akreditasi = Akreditasi.query.get(id_akreditasi)
        if not akreditasi:
            return error_response(f"Akreditasi dengan id {id_akreditasi} tidak ditemukan", 404)

        is_infokom = akreditasi.question_set.id_lembaga == 1

        today = datetime.utcnow().date()
        if akreditasi.tanggal_selesai_prodi and akreditasi.tanggal_selesai_prodi.date() < today:
            return error_response(
                f"Akreditasi sudah berakhir pada {akreditasi.tanggal_selesai_prodi.strftime('%d %B %Y')}, tidak bisa disubmit.",
                400
            )

        if akreditasi.status == 'Submitted':
            return error_response("Jawaban sudah tidak bisa diubah", 400)

        created_items = []
        updated_items = []
        skipped_items = []
        error_items = []

        if jawaban_list:
            for item in jawaban_list:
                q_no = item.get("q_no")
                jawaban = item.get("jawaban")

                if not q_no or jawaban is None:
                    error_items.append({
                        "item": item,
                        "reason": "q_no atau jawaban tidak ditemukan"
                    })
                    continue

                if is_infokom:
                    pertanyaan = LamInfokom.query.filter_by(
                        q_no=q_no,
                        id_qs=id_qs
                    ).first()
                else:
                    pertanyaan = LamEmba.query.filter_by(
                        q_no=q_no,
                        id_qs=id_qs
                    ).first()

                if not pertanyaan:
                    error_items.append({
                        "item": item,
                        "reason": f"Pertanyaan dengan q_no {q_no} tidak ditemukan"
                    })
                    continue

                if is_infokom:
                    skor_prodi = (jawaban / 4) * pertanyaan.bobot
                else:
                    skor_prodi = jawaban

                existing = Jawaban.query.filter_by(
                    id_akreditasi=id_akreditasi,
                    q_no=q_no
                ).first()

                if existing:
                    if existing.jawaban_prodi != jawaban:
                        existing.jawaban_prodi = jawaban
                        existing.skor_prodi = skor_prodi
                        updated_items.append({
                            "q_no": q_no,
                            "id_jawaban": existing.id_jawaban
                        })
                    else:
                        skipped_items.append({
                            "q_no": q_no,
                            "id_jawaban": existing.id_jawaban
                        })
                else:
                    new_jawaban = Jawaban(
                        q_no=q_no,
                        id_qs=id_qs,
                        jawaban_prodi=jawaban,
                        id_akreditasi=id_akreditasi,
                        skor_prodi=skor_prodi
                    )
                    db.session.add(new_jawaban)

                    created_items.append({
                        "q_no": q_no
                    })
            
            # update total skor - moved outside the for loop
            akreditasi.update_totals()
            akreditasi.update_progress()

        if dosen and not is_infokom:
            emba_dosen = EmbaDosen.query.filter_by(
                id_akreditasi=id_akreditasi,
                user_role='PRODI'
            ).first()
            
            if not emba_dosen:
                emba_dosen = EmbaDosen(
                    id_akreditasi=id_akreditasi,
                    user_role='PRODI'
                )
                db.session.add(emba_dosen)

            emba_dosen.dosen_total = dosen.get("dosen_total")
            emba_dosen.dosen_tetap = dosen.get("dosen_tetap")
            emba_dosen.dosen_doktor = dosen.get("dosen_doktor")
            emba_dosen.dosen_magister = dosen.get("dosen_magister")
            emba_dosen.dosen_guru_besar = dosen.get("dosen_guru_besar")
            emba_dosen.dosen_lektor_kepala = dosen.get("dosen_lektor_kepala")
            emba_dosen.dosen_lektor = dosen.get("dosen_lektor")
            emba_dosen.dosen_publikasi = dosen.get("dosen_publikasi")
            emba_dosen.dosen_sertifikat = dosen.get("dosen_sertifikat")

        if is_submit:
            user_id = get_jwt_identity()

            if is_infokom:
                all_questions = LamInfokom.query.filter_by(id_qs=akreditasi.id_qs).all()
            else:
                all_questions = LamEmba.query.filter_by(id_qs=akreditasi.id_qs).all()

            all_question_ids = {q.q_no for q in all_questions}

            answered_ids = {
                j.q_no for j in Jawaban.query.filter_by(id_akreditasi=id_akreditasi).all()
            }

            unanswered = list(all_question_ids - answered_ids)

            if unanswered:
                db.session.rollback()
                return error_response(
                    "Terdapat pertanyaan yang belum dijawab. Silakan lengkapi semua sebelum submit.",
                    400,
                    data={"unanswered_questions": unanswered}
                )
            
            if not is_infokom:
                required_dosen_fields = ['dosen_total', 'dosen_tetap', 'dosen_doktor', 'dosen_magister',
                                        'dosen_guru_besar', 'dosen_lektor_kepala', 'dosen_lektor',
                                        'dosen_publikasi', 'dosen_sertifikat']
                
                emba_dosen = EmbaDosen.query.filter_by(
                    id_akreditasi=id_akreditasi,
                    user_role='PRODI'
                ).first()
                
                if emba_dosen:
                    missing_fields = [field for field in required_dosen_fields 
                                    if getattr(emba_dosen, field) is None]
                    
                    if missing_fields:
                        db.session.rollback()
                        return error_response(
                            f"EMBA lecturer data is incomplete. The following fields are required: {', '.join(missing_fields)}",
                            400
                        )
                else:
                    return error_response(
                        f"EMBA lecturer data is missing. Please complete all required fields before submitting",
                        404
                    )

            akreditasi.id_pengisi = user_id
            akreditasi.status = "Submitted"

        akreditasi.tanggal_pengisian = datetime.utcnow()

        db.session.commit()

        return success_response(
            message="Jawaban berhasil disubmit" if is_submit else "Jawaban berhasil diproses",
            data={
                "summary": {
                    "created": len(created_items),
                    "updated": len(updated_items),
                    "skipped": len(skipped_items),
                    "errors": len(error_items)
                },
                "errors": error_items
            }
        )

    except Exception as e:
        db.session.rollback()
        return handle_exception(e)


@jawaban_bp.route("/jawaban-user/lpmi", methods=["POST"])
@jwt_required()
@role_required('LPMI', 'SUPERADMIN')
def review_lpmi():
    try:
        data = request.get_json()
        id_akreditasi = data.get("id_akreditasi")
        id_qs = data.get("id_qs")
        jawaban_list = data.get("jawaban", [])
        is_submit = data.get("is_submit", False)
        dosen = data.get('dosen')

        if not id_akreditasi:
            return error_response("id_akreditasi wajib dikirim", 400)

        akreditasi = Akreditasi.query.get(id_akreditasi)
        if not akreditasi:
            return error_response(f"Akreditasi dengan id {id_akreditasi} tidak ditemukan", 404)

        # if not isinstance(jawaban_list, list) or not jawaban_list:
        #     return error_response("Data 'jawaban' harus berupa list dan tidak boleh kosong", 400)
        
        is_infokom = akreditasi.question_set.id_lembaga == 1

        today = datetime.utcnow().date()
        if akreditasi.tanggal_selesai_lpmi and akreditasi.tanggal_selesai_lpmi.date() < today:
            return error_response(f"Akreditasi sudah berakhir pada {akreditasi.tanggal_selesai_lpmi.strftime('%d %B %Y')}, file tidak bisa diupload.", 404)
        
        error_items = []
        updated_count = 0

        if jawaban_list:    
            for item in jawaban_list:
                q_no = item.get("q_no")
                jawaban = item.get("jawaban")
                note_lpmi = item.get("note")

                if not q_no:
                    error_items.append({
                        "item": item,
                        "reason": "q_no tidak ditemukan"
                    })
                    continue

                if is_infokom:
                    pertanyaan = LamInfokom.query.filter_by(
                        q_no=q_no,
                        id_qs=id_qs
                    ).first()
                else:
                    pertanyaan = LamEmba.query.filter_by(
                        q_no=q_no,
                        id_qs=id_qs
                    ).first()

                if is_infokom:
                    skor_lpmi = (jawaban / 4) * pertanyaan.bobot
                else:
                    skor_lpmi = jawaban

                existing = Jawaban.query.filter_by(
                    id_akreditasi=id_akreditasi,
                    q_no=q_no
                ).first()

                if not existing:
                    error_items.append({
                        "item": item,
                        "reason": f"Jawaban user tidak ditemukan untuk pertanyaan {q_no}"
                    })
                    continue

                existing.jawaban_lpmi = jawaban
                existing.skor_lpmi = skor_lpmi
                if note_lpmi:
                    existing.note_lpmi = note_lpmi
                updated_count += 1

            akreditasi.update_totals()
            akreditasi.update_progress()

        if dosen and not is_infokom:
            emba_dosen = EmbaDosen.query.filter_by(
                id_akreditasi=id_akreditasi,
                user_role='LPMI'
            ).first()
            
            if not emba_dosen:
                emba_dosen = EmbaDosen(
                    id_akreditasi=id_akreditasi,
                    user_role='LPMI'
                )
                db.session.add(emba_dosen)

            emba_dosen.dosen_total = dosen.get("dosen_total")
            emba_dosen.dosen_tetap = dosen.get("dosen_tetap")
            emba_dosen.dosen_doktor = dosen.get("dosen_doktor")
            emba_dosen.dosen_magister = dosen.get("dosen_magister")
            emba_dosen.dosen_guru_besar = dosen.get("dosen_guru_besar")
            emba_dosen.dosen_lektor_kepala = dosen.get("dosen_lektor_kepala")
            emba_dosen.dosen_lektor = dosen.get("dosen_lektor")
            emba_dosen.dosen_publikasi = dosen.get("dosen_publikasi")
            emba_dosen.dosen_sertifikat = dosen.get("dosen_sertifikat")

        if is_submit:

            if is_infokom:
                all_questions = LamInfokom.query.filter_by(id_qs=akreditasi.id_qs).all()
            else:
                all_questions = LamEmba.query.filter_by(id_qs=akreditasi.id_qs).all()

            all_question_ids = {q.q_no for q in all_questions}

            answered_ids = {
                j.q_no for j in Jawaban.query.filter_by(id_akreditasi=id_akreditasi).all()
            }

            unanswered = list(all_question_ids - answered_ids)

            if unanswered:
                db.session.rollback()
                return error_response(
                    "Terdapat pertanyaan yang belum dijawab. Silakan lengkapi semua sebelum submit.",
                    400,
                    data={"unanswered_questions": unanswered}
                )
            
            if not is_infokom:
                required_dosen_fields = ['dosen_total', 'dosen_tetap', 'dosen_doktor', 'dosen_magister',
                                        'dosen_guru_besar', 'dosen_lektor_kepala', 'dosen_lektor',
                                        'dosen_publikasi', 'dosen_sertifikat']
                
                emba_dosen = EmbaDosen.query.filter_by(
                    id_akreditasi=id_akreditasi,
                    user_role='LPMI'
                ).first()
                
                if emba_dosen:
                    missing_fields = [field for field in required_dosen_fields 
                                    if getattr(emba_dosen, field) is None]
                    
                    if missing_fields:
                        db.session.rollback()
                        return error_response(
                            f"EMBA lecturer data is incomplete. The following fields are required: {', '.join(missing_fields)}",
                            400
                        )
                else:
                    return error_response(
                        f"EMBA lecturer data is missing. Please complete all required fields before submitting",
                        404
                    )
                    
            user_id = get_jwt_identity()
            akreditasi.id_validator = user_id

        akreditasi.status = "Validated" if is_submit else "Validating"
        akreditasi.tanggal_validasi = datetime.utcnow()

        if error_items:
            db.session.commit()
            return success_response(
                message=f"Review berhasil diproses dengan {updated_count} update, namun {len(error_items)} error",
                data={
                    "updated_count": updated_count,
                    "errors": error_items,
                }
            )

        db.session.commit()
        return success_response(
            message="Review berhasil diupload",
            data={
                "updated_count": updated_count,
            }
        )

    except Exception as e:
        db.session.rollback()
        return handle_exception(e)
    
@jawaban_bp.route("/jawaban-user/assesor", methods=["POST"])
@jwt_required()
@role_required('ADMIN', 'SUPERADMIN')
def review_assesor():
    try:
        data = request.get_json()
        id_akreditasi = data.get("id_akreditasi")
        id_qs = data.get("id_qs")
        jawaban_list = data.get("jawaban", [])
        is_submit = data.get("is_submit", False)
        dosen = data.get('dosen')
        evaluasi_integrasi = data.get("evaluasi_integrasi")
        rekomendasi_ak = data.get("rekomendasi_ak")
        catatan_assesor = data.get("catatan_assesor")

        if not id_akreditasi:
            return error_response("id_akreditasi wajib dikirim", 400)

        akreditasi = Akreditasi.query.get(id_akreditasi)
        if not akreditasi:
            return error_response(f"Akreditasi not found", 404)

        # if not isinstance(jawaban_list, list) or not jawaban_list:
        #     return error_response("Data 'jawaban' harus berupa list dan tidak boleh kosong", 400)
        
        is_infokom = akreditasi.question_set.id_lembaga == 1

        error_items = []
        updated_count = 0

        if jawaban_list:
            for item in jawaban_list:
                q_no = item.get("q_no")
                jawaban = item.get("jawaban")
                note_assesor = item.get("note")

                if not q_no:
                    error_items.append({
                        "item": item,
                        "reason": "q_no tidak ditemukan"
                    })
                    continue

                if is_infokom:
                    pertanyaan = LamInfokom.query.filter_by(
                        q_no=q_no,
                        id_qs=id_qs
                    ).first()
                else:
                    pertanyaan = LamEmba.query.filter_by(
                        q_no=q_no,
                        id_qs=id_qs
                    ).first()
                
                if not pertanyaan:
                    error_items.append({
                        "item": item,
                        "reason": f"Pertanyaan dengan q_no {q_no} tidak ditemukan"
                    })
                    continue
                
                if is_infokom:
                    skor_assesor = (jawaban / 4) * pertanyaan.bobot
                else:
                    skor_assesor = jawaban
                
                existing = Jawaban.query.filter_by(
                    id_akreditasi=id_akreditasi,
                    q_no=q_no
                ).first()

                if not existing:
                    error_items.append({
                        "item": item,
                        "reason": f"Jawaban user tidak ditemukan untuk pertanyaan {q_no}"
                    })
                    continue

                existing.jawaban_assesor = jawaban
                existing.skor_assesor = skor_assesor
                if note_assesor:
                    existing.note_assesor = note_assesor
                updated_count += 1
            akreditasi.update_totals()
            akreditasi.update_progress()

        if dosen and not is_infokom:
            emba_dosen = EmbaDosen.query.filter_by(
                id_akreditasi=id_akreditasi,
                user_role='ASSESOR'
            ).first()
            
            if not emba_dosen:
                emba_dosen = EmbaDosen(
                    id_akreditasi=id_akreditasi,
                    user_role='ASSESOR'
                )
                db.session.add(emba_dosen)

            emba_dosen.dosen_total = dosen.get("dosen_total")
            emba_dosen.dosen_tetap = dosen.get("dosen_tetap")
            emba_dosen.dosen_doktor = dosen.get("dosen_doktor")
            emba_dosen.dosen_magister = dosen.get("dosen_magister")
            emba_dosen.dosen_guru_besar = dosen.get("dosen_guru_besar")
            emba_dosen.dosen_lektor_kepala = dosen.get("dosen_lektor_kepala")
            emba_dosen.dosen_lektor = dosen.get("dosen_lektor")
            emba_dosen.dosen_publikasi = dosen.get("dosen_publikasi")
            emba_dosen.dosen_sertifikat = dosen.get("dosen_sertifikat")

        akreditasi.evaluasi_integrasi = evaluasi_integrasi
        akreditasi.rekomendasi_ak = rekomendasi_ak
        akreditasi.catatan_assesor = catatan_assesor

        if is_submit:
            
            if is_infokom:
                all_questions = LamInfokom.query.filter_by(id_qs=akreditasi.id_qs).all()
            else:
                all_questions = LamEmba.query.filter_by(id_qs=akreditasi.id_qs).all()

            all_question_ids = {q.q_no for q in all_questions}

            answered_ids = {
                j.q_no for j in Jawaban.query.filter_by(id_akreditasi=id_akreditasi).all()
            }

            unanswered = list(all_question_ids - answered_ids)

            if unanswered:
                db.session.rollback()
                return error_response(
                    "Terdapat pertanyaan yang belum dijawab. Silakan lengkapi semua sebelum submit.",
                    400,
                    data={"unanswered_questions": unanswered}
                )
            
            if not is_infokom:
                required_dosen_fields = ['dosen_total', 'dosen_tetap', 'dosen_doktor', 'dosen_magister',
                                        'dosen_guru_besar', 'dosen_lektor_kepala', 'dosen_lektor',
                                        'dosen_publikasi', 'dosen_sertifikat']
                
                emba_dosen = EmbaDosen.query.filter_by(
                    id_akreditasi=id_akreditasi,
                    user_role='ASSESOR'
                ).first()
                
                if emba_dosen:
                    missing_fields = [field for field in required_dosen_fields 
                                    if getattr(emba_dosen, field) is None]
                    
                    if missing_fields:
                        db.session.rollback()
                        return error_response(
                            f"EMBA lecturer data is incomplete. The following fields are required: {', '.join(missing_fields)}",
                            400
                        )
                else:
                    return error_response(
                        f"EMBA lecturer data is missing. Please complete all required fields before submitting",
                        404
                    )
        
            user_id = get_jwt_identity()
            akreditasi.id_assesor = user_id
            akreditasi.status = "Reviewed"
        else:
            akreditasi.status = "Reviewing"
            
        akreditasi.tanggal_review = datetime.utcnow()

        if error_items:
            db.session.commit()
            return success_response(
                message=f"Jawaban assesor berhasil diproses dengan {updated_count} update, namun {len(error_items)} error",
                data={
                    "updated_count": updated_count,
                    "errors": error_items,
                }
            )

        db.session.commit()
        return success_response(
            message="Jawaban assesor berhasil diupload",
            data={
                "updated_count": updated_count,
            }
        )

    except Exception as e:
        db.session.rollback()
        return handle_exception(e)
    
@jawaban_bp.route("/jawaban-user/upload_file", methods=["POST"])
@jwt_required()
@role_required('PRODI', 'SUPERADMIN')
def upload_file():

    if "file" not in request.files:
        return error_response("File tidak ditemukan", 404)

    file = request.files["file"]
    q_no = int(request.form.get("q_no"))
    id_akreditasi = request.form.get("id_akreditasi")

    if not q_no or not id_akreditasi:
        return error_response( "q_no atau jawaban tidak ditemukan", 404)
    

    akreditasi = Akreditasi.query.get(id_akreditasi)
    if not akreditasi:
        return error_response(f"Akreditasi dengan id {id_akreditasi} tidak ditemukan", 404)
    
    is_infokom = akreditasi.question_set.id_lembaga == 1

    if is_infokom:
        pertanyaan = LamInfokom.query.filter_by(
                    q_no=q_no,
                    id_qs=akreditasi.id_qs
                ).first()
    else:
        pertanyaan = LamEmba.query.filter_by(
                    q_no=q_no,
                    id_qs=akreditasi.id_qs
                ).first()
    
    if not pertanyaan:
        return error_response(f"pertanyaan dengan id {id_akreditasi} tidak ditemukan", 404)
    
    today = datetime.utcnow().date()
    if akreditasi.tanggal_selesai_prodi.date() < today:
        return error_response(f"Akreditasi sudah berakhir pada {akreditasi.tanggal_selesai_prodi.strftime('%d %B %Y')}, file tidak bisa diupload.", 404)


    jawaban = Jawaban.query.filter_by(
        q_no=q_no,
        id_akreditasi=id_akreditasi
    ).first()

    if not jawaban:
        jawaban = Jawaban(
            q_no=q_no,
            id_akreditasi=id_akreditasi,
            id_qs = akreditasi.id_qs
        )
        db.session.add(jawaban)
        db.session.commit()

    filename = secure_filename(file.filename)

    # old_files = UploadFile.query.filter_by(id_jawaban=jawaban.id_jawaban).all()

    # for old in old_files:
    #     if os.path.exists(old.file_path):
    #         os.remove(old.file_path)
    #     db.session.delete(old)

    # db.session.commit()

    path = os.path.join(UPLOAD_FOLDER, filename)
    file.save(path)

    upload = UploadFile(
        id_jawaban=jawaban.id_jawaban,
        file_name=filename,
        file_path=path,
        file_size=os.path.getsize(path)
    )

    db.session.add(upload)
    db.session.commit()

    return success_response(
            message="File berhasil diupload",
            data= None
        )

@jawaban_bp.route("/jawaban-user/upload_file/<id_file>", methods=["DELETE"])
@jwt_required()
@role_required('PRODI', 'SUPERADMIN')
def delete_file(id_file):

    old_file = UploadFile.query.get(id_file)
    if not old_file:
        return error_response("File tidak ditemukan", 404)

    if old_file.file_path and os.path.exists(old_file.file_path):
        os.remove(old_file.file_path)
    db.session.delete(old_file)
    db.session.commit()

    return success_response(
            message="File berhasil dihapus",
            data= None
        )

@jawaban_bp.route("/jawaban-user/download_file/<id_file>", methods=["GET"])
@cross_origin(expose_headers=["Content-Disposition"])
def download_file(id_file):
    upload = UploadFile.query.get(id_file)

    if not upload:
        return {"error": "File tidak ditemukan"}, 404

    if not os.path.exists(upload.file_path):
        return {"error": "File tidak ada di server"}, 404
    
    mime_type, _ = mimetypes.guess_type(upload.file_path)

    response = make_response(send_file(
        upload.file_path,
        as_attachment=True,
        mimetype=mime_type or "application/octet-stream",
        download_name=upload.file_name
    ))

    response.headers["Access-Control-Allow-Credentials"] = "true"
    response.headers["Cache-Control"] = "no-store"

    return response

# @jawaban_bp.route("/jawaban-user/<id_Akreditasi>", methods=["GET"])
# @jwt_required()
# def get_jawaban_user_by_Akreditasi(id_Akreditasi):
#     try:
#         Akreditasi = Akreditasi.query.get(id_Akreditasi)
#         if not Akreditasi:
#             return error_response(f"Akreditasi dengan id {id_Akreditasi} tidak ditemukan", 404)

#         jawaban_list = JawabanUser.query.filter_by(id_Akreditasi=id_Akreditasi).all()

#         if not jawaban_list:
#             return success_response(
#                 data=[],
#                 message="Tidak ada jawaban dalam Akreditasi ini"
#             )

#         results = []
#         for j in jawaban_list:

#             files = []
#             if j.uploads:
#                 for f in j.uploads:
#                     files.append({
#                         "id_file": f.id_file,
#                         "file_name": f.file_name,
#                     })

#             results.append({
#                 "id_jawaban": j.id_jawaban,
#                 "q_no": j.q_no,
#                 "jawaban_prodi": j.jawaban_prodi,
#                 "skor_prodi": j.skor_prodi,
#                 "jawaban_lpmi": j.jawaban_lpmi,
#                 "skor_lpmi": j.skor_lpmi,
#                 "note_lpmi": j.note_lpmi,
#                 "jawaban_assesor": j.jawaban_assesor,
#                 "skor_assesor": j.skor_assesor,
#                 "note_assesor": j.note_assesor,
#                 "files": files
#             })

#         return success_response(
#             data={
#                 "jumlah_jawaban": len(results),
#                 "jawaban": results,
#                 "Akreditasi_info": {
#                     "total_skor_prodi": Akreditasi.total_skor_prodi,
#                     "total_skor_lpmi": Akreditasi.total_skor_lpmi
#                 }
#             },
#             message="Data jawaban berhasil diambil"
#         )

#     except Exception as e:
#         return handle_exception(e)


# @jawaban_bp.route("/jawaban-user", methods=["POST"])
# @jwt_required()
# @role_required('PRODI', 'SUPERADMIN')
# def saved_submit_jawaban():
#     try:
#         data = request.get_json()

#         id_Akreditasi = data.get("id_Akreditasi")
#         jawaban_list = data.get("jawaban", [])
#         is_submit = data.get("is_submit", False)

#         if not id_Akreditasi:
#             return error_response("id_Akreditasi wajib dikirim", 400)
         

#         Akreditasi = Akreditasi.query.get(id_Akreditasi)
#         if not Akreditasi:
#             return error_response(f"Akreditasi dengan id {id_Akreditasi} tidak ditemukan", 404)
        
#         today = datetime.utcnow().date()
#         if Akreditasi.tanggal_selesai.date() < today:
#              return error_response(f"Akreditasi sudah berakhir pada {Akreditasi.tanggal_selesai.strftime('%d %B %Y')}, tidak bisa disubmit.", 404)
        
#         if Akreditasi.status == 'Submitted':
#             return error_response("Jawaban sudah tidak bisa diubah", 400)

#         if not isinstance(jawaban_list, list) or not jawaban_list:
#             return error_response("Data 'jawaban' harus berupa list dan tidak boleh kosong", 400)

#         created_items = []
#         updated_items = []
#         skipped_items = []
#         error_items = []

#         for item in jawaban_list:
#             q_no = item.get("q_no")
#             jawaban = item.get("jawaban")

#             if not q_no or not jawaban:
#                 error_items.append({
#                     "item": item,
#                     "reason": "q_no atau jawaban tidak ditemukan"
#                 })
#                 continue

#             pertanyaan = Pertanyaan.query.get(q_no)
#             if not pertanyaan:
#                 error_items.append({
#                     "item": item,
#                     "reason": f"Pertanyaan dengan id {q_no} tidak ditemukan"
#                 })
#                 continue

#             indikator = IndikatorJawaban.query.filter_by(
#                 jawaban=jawaban,
#                 q_no=q_no
#             ).first()
            
#             if not indikator:
#                 error_items.append({
#                     "item": item,
#                     "reason": f"Indikator dengan id {jawaban} tidak ditemukan untuk pertanyaan {q_no}"
#                 })
#                 continue

#             skor_prodi = (indikator.skor / 4) * pertanyaan.bobot # 4 is template max score, might change later (NEED CONFIRMATION)

#             existing = JawabanUser.query.filter_by(
#                 id_Akreditasi=id_Akreditasi,
#                 q_no=q_no
#             ).first()

#             if existing:
#                 if existing.jawaban_prodi != jawaban:
#                     existing.jawaban_prodi = jawaban
#                     existing.skor_prodi = skor_prodi
#                     updated_items.append({
#                         "q_no": q_no,
#                         "id_jawaban": existing.id_jawaban
#                     })
#                 else:
#                     skipped_items.append({
#                         "q_no": q_no,
#                         "id_jawaban": existing.id_jawaban
#                     })
#             else:
#                 jawaban = JawabanUser(
#                     q_no=q_no,
#                     jawaban_prodi=jawaban,
#                     id_Akreditasi=id_Akreditasi,
#                     skor_prodi=skor_prodi
#                 )
#                 db.session.add(jawaban)
#                 created_items.append({
#                     "q_no": q_no,
#                 })
        
#         Akreditasi.update_totals()
                
#         if is_submit:
#             user_id = get_jwt_identity()
#             all_questions = Pertanyaan.query.filter_by(id_versi=Akreditasi.id_versi).all()
#             all_question_ids = {q.q_no for q in all_questions}

#             answered_ids = {
#                 j.q_no for j in JawabanUser.query.filter_by(id_Akreditasi=id_Akreditasi).all()
#             }

#             unanswered = list(all_question_ids - answered_ids)

#             if unanswered:
#                 db.session.rollback()
#                 return error_response(
#                     "Terdapat pertanyaan yang belum dijawab. Silakan lengkapi semua sebelum submit.",
#                     400,
#                     data={"unanswered_questions": unanswered}
#                 )
#             Akreditasi.id_pengisi = user_id
#             Akreditasi.status = "Submitted"
        
#         Akreditasi.tanggal_pengisian = datetime.utcnow()

#         db.session.commit()

#         response_message = "Jawaban berhasil disubmit" if is_submit else "Jawaban berhasil diproses"
        
#         return success_response(
#             data={
#                 "summary": {
#                     "created": len(created_items),
#                     "updated": len(updated_items),
#                     "skipped": len(skipped_items),
#                     "errors": len(error_items)
#                 },
#             },
#             message=response_message
#         )

#     except Exception as e:
#         db.session.rollback()
#         return handle_exception(e)

# @jawaban_bp.route("/jawaban-user/lpmi", methods=["POST"])
# @jwt_required()
# @role_required('LPMI', 'SUPERADMIN')
# def review_lpmi():
#     try:
#         data = request.get_json()
#         id_Akreditasi = data.get("id_Akreditasi")
#         jawaban_list = data.get("jawaban", [])
#         is_submit = data.get("is_submit", False)

#         if not id_Akreditasi:
#             return error_response("id_Akreditasi wajib dikirim", 400)

#         Akreditasi = Akreditasi.query.get(id_Akreditasi)
#         if not Akreditasi:
#             return error_response(f"Akreditasi dengan id {id_Akreditasi} tidak ditemukan", 404)

#         if not isinstance(jawaban_list, list) or not jawaban_list:
#             return error_response("Data 'jawaban' harus berupa list dan tidak boleh kosong", 400)

#         error_items = []
#         updated_count = 0

#         for item in jawaban_list:
#             q_no = item.get("q_no")
#             jawaban = item.get("jawaban")
#             note_lpmi = item.get("note")

#             if not q_no:
#                 error_items.append({
#                     "item": item,
#                     "reason": "q_no tidak ditemukan"
#                 })
#                 continue

#             pertanyaan = Pertanyaan.query.get(q_no)
#             if not pertanyaan:
#                 error_items.append({
#                     "item": item,
#                     "reason": f"Pertanyaan dengan id {q_no} tidak ditemukan"
#                 })
#                 continue

#             indikator = IndikatorJawaban.query.filter_by(
#                 jawaban=jawaban,
#                 q_no=q_no
#             ).first()
            
#             if not indikator:
#                 error_items.append({
#                     "item": item,
#                     "reason": f"Indikator dengan id {jawaban} tidak ditemukan untuk pertanyaan {q_no}"
#                 })
#                 continue

#             skor_lpmi = (indikator.skor / 4) * pertanyaan.bobot # 4 is template max score, might change later (NEED CONFIRMATION)
#             existing = JawabanUser.query.filter_by(
#                 id_Akreditasi=id_Akreditasi,
#                 q_no=q_no
#             ).first()

#             if not existing:
#                 error_items.append({
#                     "item": item,
#                     "reason": f"Jawaban user tidak ditemukan untuk pertanyaan {q_no}"
#                 })
#                 continue

#             existing.jawaban_lpmi = jawaban
#             existing.skor_lpmi = skor_lpmi
#             if note_lpmi:
#                 existing.note_lpmi = note_lpmi
#             updated_count += 1

#         Akreditasi.update_totals()

#         if is_submit:
#             user_id = get_jwt_identity()
#             Akreditasi.id_validator = user_id
#         Akreditasi.status = "Validated" if is_submit else "Validating"
#         Akreditasi.tanggal_validasi = datetime.utcnow()

#         if error_items:
#             db.session.commit()
#             return success_response(
#                 message=f"Review berhasil diproses dengan {updated_count} update, namun {len(error_items)} error",
#                 data={
#                     "updated_count": updated_count,
#                     "errors": error_items,
#                 }
#             )

#         db.session.commit()
#         return success_response(
#             message="Review berhasil diupload",
#             data={
#                 "updated_count": updated_count,
#             }
#         )

#     except Exception as e:
#         db.session.rollback()
#         return handle_exception(e)
    
# @jawaban_bp.route("/jawaban-user/assesor", methods=["POST"])
# @jwt_required()
# @role_required('ADMIN', 'SUPERADMIN')
# def review_assesor():
#     try:
#         data = request.get_json()
#         id_Akreditasi = data.get("id_Akreditasi")
#         jawaban_list = data.get("jawaban", [])
#         is_submit = data.get("is_submit", False)

#         if not id_Akreditasi:
#             return error_response("id_Akreditasi wajib dikirim", 400)

#         Akreditasi = Akreditasi.query.get(id_Akreditasi)
#         if not Akreditasi:
#             return error_response(f"Akreditasi dengan id {id_Akreditasi} tidak ditemukan", 404)

#         if not isinstance(jawaban_list, list) or not jawaban_list:
#             return error_response("Data 'jawaban' harus berupa list dan tidak boleh kosong", 400)

#         error_items = []
#         updated_count = 0

#         for item in jawaban_list:
#             q_no = item.get("q_no")
#             jawaban = item.get("jawaban")
#             note_assesor = item.get("note")

#             if not q_no:
#                 error_items.append({
#                     "item": item,
#                     "reason": "q_no tidak ditemukan"
#                 })
#                 continue

#             pertanyaan = Pertanyaan.query.get(q_no)
#             if not pertanyaan:
#                 error_items.append({
#                     "item": item,
#                     "reason": f"Pertanyaan dengan id {q_no} tidak ditemukan"
#                 })
#                 continue

#             indikator = IndikatorJawaban.query.filter_by(
#                 jawaban=jawaban,
#                 q_no=q_no
#             ).first()
            
#             if not indikator:
#                 error_items.append({
#                     "item": item,
#                     "reason": f"Indikator dengan id {jawaban} tidak ditemukan untuk pertanyaan {q_no}"
#                 })
#                 continue

#             skor_assesor = (indikator.skor / 4) * pertanyaan.bobot # 4 is template max score, might change later (NEED CONFIRMATION)
#             existing = JawabanUser.query.filter_by(
#                 id_Akreditasi=id_Akreditasi,
#                 q_no=q_no
#             ).first()

#             if not existing:
#                 error_items.append({
#                     "item": item,
#                     "reason": f"Jawaban user tidak ditemukan untuk pertanyaan {q_no}"
#                 })
#                 continue

#             existing.jawaban_assesor = jawaban
#             existing.skor_assesor = skor_assesor
#             if note_assesor:
#                 existing.note_assesor = note_assesor
#             updated_count += 1

#         Akreditasi.update_totals()
        
#         if is_submit:
#             Akreditasi.status = "Reviewed"
            
#         Akreditasi.tanggal_review = datetime.utcnow()

#         if error_items:
#             db.session.commit()
#             return success_response(
#                 message=f"Jawaban assesor berhasil diproses dengan {updated_count} update, namun {len(error_items)} error",
#                 data={
#                     "updated_count": updated_count,
#                     "errors": error_items,
#                 }
#             )

#         db.session.commit()
#         return success_response(
#             message="Jawaban assesor berhasil diupload",
#             data={
#                 "updated_count": updated_count,
#             }
#         )

#     except Exception as e:
#         db.session.rollback()
#         return handle_exception(e)
    
# @jawaban_bp.route("/jawaban-user/upload_file", methods=["POST"])
# @jwt_required()
# @role_required('PRODI', 'SUPERADMIN')
# def upload_file():

#     if "file" not in request.files:
#         return error_response("File tidak ditemukan", 404)

#     file = request.files["file"]
#     q_no = request.form.get("q_no")
#     id_Akreditasi = request.form.get("id_Akreditasi")

#     if not q_no or not id_Akreditasi:
#         return error_response( "q_no atau jawaban tidak ditemukan", 404)
    
#     pertanyaan = Pertanyaan.query.get(q_no)
#     if not pertanyaan:
#         return error_response(f"pertanyaan dengan id {id_Akreditasi} tidak ditemukan", 404)

#     Akreditasi = Akreditasi.query.get(id_Akreditasi)
#     if not Akreditasi:
#         return error_response(f"Akreditasi dengan id {id_Akreditasi} tidak ditemukan", 404)
    
#     today = datetime.utcnow().date()
#     if Akreditasi.tanggal_selesai.date() < today:
#         return error_response(f"Akreditasi sudah berakhir pada {Akreditasi.tanggal_selesai.strftime('%d %B %Y')}, file tidak bisa diupload.", 404)


#     jawaban = JawabanUser.query.filter_by(
#         q_no=q_no,
#         id_Akreditasi=id_Akreditasi
#     ).first()

#     if not jawaban:
#         jawaban = JawabanUser(
#             q_no=q_no,
#             id_Akreditasi=id_Akreditasi
#         )
#         db.session.add(jawaban)
#         db.session.commit()

#     filename = secure_filename(file.filename)

#     # old_files = UploadFile.query.filter_by(id_jawaban=jawaban.id_jawaban).all()

#     # for old in old_files:
#     #     if os.path.exists(old.file_path):
#     #         os.remove(old.file_path)
#     #     db.session.delete(old)

#     # db.session.commit()

#     path = os.path.join(UPLOAD_FOLDER, filename)
#     file.save(path)

#     upload = UploadFile(
#         id_jawaban=jawaban.id_jawaban,
#         file_name=filename,
#         file_path=path,
#         file_size=os.path.getsize(path)
#     )

#     db.session.add(upload)
#     db.session.commit()

#     return success_response(
#             message="File berhasil diupload",
#             data= None
#         )

# @jawaban_bp.route("/jawaban-user/upload_file/<id_file>", methods=["DELETE"])
# @jwt_required()
# @role_required('PRODI', 'SUPERADMIN')
# def delete_file(id_file):

#     old_file = UploadFile.query.get(id_file)
#     if not old_file:
#         return error_response("File tidak ditemukan", 404)

#     if old_file.file_path and os.path.exists(old_file.file_path):
#         os.remove(old_file.file_path)
#     db.session.delete(old_file)
#     db.session.commit()

#     return success_response(
#             message="File berhasil dihapus",
#             data= None
#         )

# @jawaban_bp.route("/jawaban-user/download_file/<id_file>", methods=["GET"])
# @cross_origin(expose_headers=["Content-Disposition"])
# def download_file(id_file):
#     upload = UploadFile.query.get(id_file)

#     if not upload:
#         return {"error": "File tidak ditemukan"}, 404

#     if not os.path.exists(upload.file_path):
#         return {"error": "File tidak ada di server"}, 404
    
#     mime_type, _ = mimetypes.guess_type(upload.file_path)

#     response = make_response(send_file(
#         upload.file_path,
#         as_attachment=True,
#         mimetype=mime_type or "application/octet-stream",
#         download_name=upload.file_name
#     ))

#     response.headers["Access-Control-Allow-Credentials"] = "true"
#     response.headers["Cache-Control"] = "no-store"

#     return response

#---------------------------JUNK CODE----------------------------------------------------------------
# @jawaban_bp.route("/Akreditasi/<id_Akreditasi>/statistics", methods=["GET"])
# def get_Akreditasi_statistics(id_Akreditasi):
#     try:
#         Akreditasi = Akreditasi.query.get(id_Akreditasi)
#         if not Akreditasi:
#             return error_response(f"Akreditasi dengan id {id_Akreditasi} tidak ditemukan", 404)
        
#         regulasi_max = Akreditasi.regulasi.total_max_bobot if Akreditasi.regulasi else 0
#         question_stats = []
#         for jawaban in Akreditasi.jawaban_user:
#             question_stats.append({
#                 "q_no": jawaban.q_no,
#                 "deskripsi_pertanyaan": jawaban.pertanyaan.deskripsi_pertanyaan[:100] + "..." if len(jawaban.pertanyaan.deskripsi_pertanyaan) > 100 else jawaban.pertanyaan.deskripsi_pertanyaan,
#                 "skor_prodi": jawaban.indikator.skor if jawaban.indikator else 0,
#                 "skor_lpmi": jawaban.skor_lpmi or 0,
#                 "gap": (jawaban.indikator.skor if jawaban.indikator else 0) - (jawaban.skor_lpmi or 0),
#                 "note_lpmi": jawaban.note_lpmi
#             })

#         return success_response(
#             data={
#                 "Akreditasi_info": {
#                     "id_Akreditasi": Akreditasi.id_Akreditasi,
#                     "nama_Akreditasi": Akreditasi.nama_Akreditasi,
#                     "status": Akreditasi.status,
#                     "prodi": Akreditasi.prodi.nama_prodi if Akreditasi.prodi else None
#                 },
#                 "totals": {
#                     "total_skor_prodi": Akreditasi.total_skor_prodi,
#                     "total_skor_lpmi": Akreditasi.total_skor_lpmi,
#                     "max_possible_score": regulasi_max,
#                     "prodi_percentage": round((Akreditasi.total_skor_prodi / regulasi_max * 100), 2) if regulasi_max > 0 else 0,
#                     "lpmi_percentage": round((Akreditasi.total_skor_lpmi / regulasi_max * 100), 2) if regulasi_max > 0 else 0,
#                     "total_gap": Akreditasi.total_skor_prodi - Akreditasi.total_skor_lpmi
#                 },
#                 "question_breakdown": question_stats,
#                 "summary": {
#                     "total_questions": len(question_stats),
#                     "questions_with_notes": sum(1 for q in question_stats if q["note_lpmi"]),
#                     "average_gap": round(sum(q["gap"] for q in question_stats) / len(question_stats), 2) if question_stats else 0
#                 }
#             },
#             message="Statistik Akreditasi berhasil diambil"
#         )

#     except Exception as e:
#         return handle_exception(e)