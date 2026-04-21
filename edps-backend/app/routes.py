from flask import Blueprint, jsonify, request
from app import db
from app.models import Periode, Pertanyaan, Regulasi, JawabanUser, IndikatorJawaban
import uuid
from datetime import datetime
from sqlalchemy.exc import SQLAlchemyError

main = Blueprint("main", __name__)

@main.route("/")
def home():
    return jsonify({
        "success": True,
        "message": "Quiz API is running!",
        "data": None
    })

## API REGULASI 
@main.route("/regulasi", methods=["POST"])
def add_regulasi():
    try:
        data = request.get_json()
        
        required_fields = ["nama_regulasi", "deskripsi_regulasi", "tahun_berlaku"]
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({
                    "success": False,
                    "message": f"Field '{field}' wajib diisi",
                    "data": None
                }), 400
        
        id_regulasi = f"R{str(uuid.uuid4())[:10].upper()}" 
        
        regulasi = Regulasi(
            id_regulasi=id_regulasi,
            nama_regulasi=data["nama_regulasi"],
            deskripsi_regulasi=data["deskripsi_regulasi"],
            tahun_berlaku=data["tahun_berlaku"],
        )
        
        db.session.add(regulasi)
        db.session.commit()

        return jsonify({
            "success": True,
            "message": "Regulasi berhasil ditambahkan",
            "data": {
                "id_regulasi": regulasi.id_regulasi,
                "nama_regulasi": regulasi.nama_regulasi,
                "deskripsi_regulasi": regulasi.deskripsi_regulasi,
                "tahun_berlaku": regulasi.tahun_berlaku
            }
        }), 201

    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({
            "success": False,
            "message": f"Database error: {str(e)}",
            "data": None
        }), 500
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Terjadi kesalahan: {str(e)}",
            "data": None
        }), 500

## API PERTANYAAN
@main.route("/pertanyaan", methods=["POST"])
def add_pertanyaan():
    try:
        data = request.get_json()

        required_fields = ["id_regulasi", "deskripsi_pertanyaan"]
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({
                    "success": False,
                    "message": f"Field '{field}' wajib diisi",
                    "data": None
                }), 400

        regulasi = Regulasi.query.get(data["id_regulasi"])
        if not regulasi:
            return jsonify({
                "success": False,
                "message": f"Regulasi dengan id {data['id_regulasi']} tidak ditemukan",
                "data": None
            }), 404

        id_pertanyaan = f"P{str(uuid.uuid4())[:10].upper()}" 

        pertanyaan = Pertanyaan(
            id_pertanyaan=id_pertanyaan,
            id_regulasi=data["id_regulasi"],
            deskripsi_pertanyaan=data["deskripsi_pertanyaan"]
        )

        indikator_list = data.get("indikator_jawaban", [])
        if not indikator_list:
            return jsonify({
                "success": False,
                "message": "Indikator jawaban tidak boleh kosong",
                "data": None
            }), 400

        for item in indikator_list:
            indikator = IndikatorJawaban(
                id_indikator=item.get("id_indikator") or f"I{str(uuid.uuid4())[:8].upper()}",
                id_pertanyaan=id_pertanyaan,
                skor=item.get("skor"),
                label=item.get("label"),
                deskripsi=item.get("deskripsi")
            )
            pertanyaan.indikator_jawaban.append(indikator)

        db.session.add(pertanyaan)
        db.session.commit()

        return jsonify({
            "success": True,
            "message": "Pertanyaan dan indikator berhasil ditambahkan",
            "data": {
                "id_pertanyaan": pertanyaan.id_pertanyaan,
                "id_regulasi": pertanyaan.id_regulasi,
                "deskripsi_pertanyaan": pertanyaan.deskripsi_pertanyaan,
                "indikator_jawaban": [
                    {
                        "id_indikator": i.id_indikator,
                        "label": i.label,
                        "skor": i.skor,
                        "deskripsi": i.deskripsi
                    }
                    for i in pertanyaan.indikator_jawaban
                ]
            }
        }), 201

    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({
            "success": False,
            "message": f"Database error: {str(e)}",
            "data": None
        }), 500
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Terjadi kesalahan: {str(e)}",
            "data": None
        }), 500

@main.route("/pertanyaan/<id_regulasi>", methods=["GET"])
def get_pertanyaan_by_regulasi(id_regulasi):
    try:
        regulasi = Regulasi.query.get(id_regulasi)
        if not regulasi:
            return jsonify({
                "success": False,
                "message": f"Regulasi dengan id {id_regulasi} tidak ditemukan",
                "data": None
            }), 404

        pertanyaan_list = Pertanyaan.query.filter_by(id_regulasi=id_regulasi).all()

        if not pertanyaan_list:
            return jsonify({
                "success": True,
                "message": f"Tidak ada pertanyaan untuk regulasi dengan id {id_regulasi}",
                "data": []
            }), 200

        results = []
        for p in pertanyaan_list:
            results.append({
                "id_pertanyaan": p.id_pertanyaan,
                "deskripsi_pertanyaan": p.deskripsi_pertanyaan,
                "indikator_jawaban": [
                    {
                        "id_indikator": i.id_indikator,
                        "label": i.label,
                        "skor": i.skor,
                        "deskripsi": i.deskripsi
                    }
                    for i in p.indikator_jawaban
                ]
            })

        return jsonify({
            "success": True,
            "message": "Data pertanyaan berhasil diambil",
            "data": {
                "jumlah_pertanyaan": len(results),
                "pertanyaan": results
            }
        }), 200

    except SQLAlchemyError as e:
        return jsonify({
            "success": False,
            "message": f"Database error: {str(e)}",
            "data": None
        }), 500
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Terjadi kesalahan: {str(e)}",
            "data": None
        }), 500

## API PERIODE
@main.route('/periode', methods=["GET"])
def get_periode():
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 5, type=int)

        if page < 1 or per_page < 1:
            return jsonify({
                "success": False,
                "message": "Page dan per_page harus lebih dari 0",
                "data": None
            }), 400

        pagination = Periode.query.paginate(page=page, per_page=per_page, error_out=False)

        results = []
        for p in pagination.items:
            periode_data = {
                "id_periode": p.id_periode,
                "nama_periode": p.nama_periode,
                "status": p.status,
                "total_bobot": p.total_bobot,
                "id_regulasi": p.id_regulasi
            }
            
            # Format tanggal jika ada
            if p.tanggal_pengisian:
                periode_data["tanggal_pengisian"] = p.tanggal_pengisian.isoformat()
            if p.tanggal_mulai:
                periode_data["tanggal_mulai"] = p.tanggal_mulai.isoformat()
            if p.tanggal_selesai:
                periode_data["tanggal_selesai"] = p.tanggal_selesai.isoformat()
                
            results.append(periode_data)

        return jsonify({
            "success": True,
            "message": "Data periode berhasil diambil",
            "data": {
                "results": results,
                "totalCount": pagination.total,
                "currentPage": pagination.page,
                "pageSize": pagination.per_page,
                "totalPages": pagination.pages
            }
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Terjadi kesalahan: {str(e)}",
            "data": None
        }), 500

@main.route('/periode', methods=["POST"])
def add_periode():
    try:
        data = request.get_json()

        required_fields = ["tanggal_mulai", "tanggal_selesai", "nama_periode", "id_regulasi"]
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({
                    "success": False,
                    "message": f"Field '{field}' wajib diisi",
                    "data": None
                }), 400
        
        regulasi = Regulasi.query.get(data["id_regulasi"])
        if not regulasi:
            return jsonify({
                "success": False,
                "message": f"Regulasi dengan id {data['id_regulasi']} tidak ditemukan",
                "data": None
            }), 404
        
        try:
            tanggal_mulai = datetime.fromisoformat(data["tanggal_mulai"].replace('Z', '+00:00'))
            tanggal_selesai = datetime.fromisoformat(data["tanggal_selesai"].replace('Z', '+00:00'))
        except ValueError:
            return jsonify({
                "success": False,
                "message": "Format tanggal tidak valid. Gunakan format ISO 8601",
                "data": None
            }), 400
            
        if tanggal_mulai >= tanggal_selesai:
            return jsonify({
                "success": False,
                "message": "Tanggal mulai harus lebih awal dari tanggal selesai",
                "data": None
            }), 400

        id_periode = f"PER{str(uuid.uuid4())[:8].upper()}"
        
        periode = Periode(
            id_periode=id_periode,
            tanggal_mulai=tanggal_mulai,
            tanggal_selesai=tanggal_selesai,
            nama_periode=data["nama_periode"],
            id_regulasi=data["id_regulasi"],
            status="Draft",  # Default status
            total_bobot=0  # Default total bobot
        )
        
        db.session.add(periode)
        db.session.commit()

        return jsonify({
            "success": True,
            "message": "Periode berhasil ditambahkan",
            "data": {
                "id_periode": periode.id_periode,
                "nama_periode": periode.nama_periode,
                "tanggal_mulai": periode.tanggal_mulai.isoformat(),
                "tanggal_selesai": periode.tanggal_selesai.isoformat(),
                "status": periode.status,
                "id_regulasi": periode.id_regulasi
            }
        }), 201

    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({
            "success": False,
            "message": f"Database error: {str(e)}",
            "data": None
        }), 500
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Terjadi kesalahan: {str(e)}",
            "data": None
        }), 500

## JAWABAN USER API
@main.route("/jawaban-user/<id_periode>", methods=["GET"])
def get_jawaban_user_by_periode(id_periode):
    try:
        # Cek apakah periode ada
        periode = Periode.query.get(id_periode)
        if not periode:
            return jsonify({
                "success": False,
                "message": f"Periode dengan id {id_periode} tidak ditemukan",
                "data": None
            }), 404

        jawaban_list = JawabanUser.query.filter_by(id_periode=id_periode).all()

        if not jawaban_list:
            return jsonify({
                "success": True,
                "message": "Tidak ada jawaban dalam periode ini",
                "data": []
            }), 200

        results = []
        for j in jawaban_list:
            results.append({
                "id_jawaban": j.id_jawaban,
                "id_pertanyaan": j.id_pertanyaan,
                "id_indikator": j.id_indikator,
                "skor_prodi": j.skor_prodi,
                "created_at": j.created_at.isoformat() if j.created_at else None
            })

        return jsonify({
            "success": True,
            "message": "Data jawaban berhasil diambil",
            "data": {
                "jumlah_jawaban": len(results),
                "jawaban": results,
                "periode_info": {
                    "id_periode": periode.id_periode,
                    "nama_periode": periode.nama_periode,
                    "status": periode.status
                }
            }
        }), 200

    except SQLAlchemyError as e:
        return jsonify({
            "success": False,
            "message": f"Database error: {str(e)}",
            "data": None
        }), 500
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Terjadi kesalahan: {str(e)}",
            "data": None
        }), 500

@main.route("/jawaban", methods=["POST"])
def saved_submit_jawaban():
    try:
        data = request.get_json()

        id_periode = data.get("id_periode")
        jawaban_list = data.get("jawaban", [])
        is_submit = data.get("is_submit", False)

        if not id_periode:
            return jsonify({
                "success": False,
                "message": "id_periode wajib dikirim",
                "data": None
            }), 400

        periode = Periode.query.get(id_periode)
        if not periode:
            return jsonify({
                "success": False,
                "message": f"Periode dengan id {id_periode} tidak ditemukan",
                "data": None
            }), 404

        if not isinstance(jawaban_list, list) or not jawaban_list:
            return jsonify({
                "success": False,
                "message": "Data 'jawaban' harus berupa list dan tidak boleh kosong",
                "data": None
            }), 400

        created_items = []
        updated_items = []
        skipped_items = []
        error_items = []

        for item in jawaban_list:
            id_pertanyaan = item.get("id_pertanyaan")
            id_indikator = item.get("id_indikator")

            if not id_pertanyaan or not id_indikator:
                error_items.append({
                    "item": item,
                    "reason": "id_pertanyaan atau id_indikator tidak ditemukan"
                })
                continue

            # Cek apakah pertanyaan ada
            pertanyaan = Pertanyaan.query.get(id_pertanyaan)
            if not pertanyaan:
                error_items.append({
                    "item": item,
                    "reason": f"Pertanyaan dengan id {id_pertanyaan} tidak ditemukan"
                })
                continue

            # Cek apakah indikator ada dan milik pertanyaan yang benar
            indikator = IndikatorJawaban.query.filter_by(
                id_indikator=id_indikator,
                id_pertanyaan=id_pertanyaan
            ).first()
            
            if not indikator:
                error_items.append({
                    "item": item,
                    "reason": f"Indikator dengan id {id_indikator} tidak ditemukan untuk pertanyaan {id_pertanyaan}"
                })
                continue

            skor_prodi = indikator.skor

            existing = JawabanUser.query.filter_by(
                id_periode=id_periode,
                id_pertanyaan=id_pertanyaan
            ).first()

            if existing:
                if existing.id_indikator != id_indikator:
                    existing.id_indikator = id_indikator
                    existing.skor_prodi = skor_prodi
                    updated_items.append({
                        "id_pertanyaan": id_pertanyaan,
                        "id_jawaban": existing.id_jawaban
                    })
                else:
                    skipped_items.append({
                        "id_pertanyaan": id_pertanyaan,
                        "id_jawaban": existing.id_jawaban
                    })
            else:
                id_jawaban = f"J{str(uuid.uuid4())[:10].upper()}"
                jawaban = JawabanUser(
                    id_jawaban=id_jawaban,
                    id_pertanyaan=id_pertanyaan,
                    id_indikator=id_indikator,
                    id_periode=id_periode,
                    skor_prodi=skor_prodi
                )
                db.session.add(jawaban)
                created_items.append({
                    "id_pertanyaan": id_pertanyaan,
                    "id_jawaban": id_jawaban
                })

        # Update status periode
        periode.status = "Submitted" if is_submit else "Saved"
        
        # Hitung total bobot
        total_bobot = sum(j.skor_prodi for j in JawabanUser.query.filter_by(id_periode=id_periode).all())
        periode.total_bobot = total_bobot

        db.session.commit()

        response_message = "Jawaban berhasil diproses"
        if is_submit:
            response_message = "Jawaban berhasil disubmit"
        
        return jsonify({
            "success": True,
            "message": response_message,
            "data": {
                "periode": {
                    "id_periode": periode.id_periode,
                    "status": periode.status,
                    "total_bobot": periode.total_bobot
                },
                "summary": {
                    "created": len(created_items),
                    "updated": len(updated_items),
                    "skipped": len(skipped_items),
                    "errors": len(error_items)
                },
                "details": {
                    "created_items": created_items,
                    "updated_items": updated_items,
                    "skipped_items": skipped_items,
                    "error_items": error_items if error_items else None
                }
            }
        }), 200

    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({
            "success": False,
            "message": f"Database error: {str(e)}",
            "data": None
        }), 500
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Terjadi kesalahan: {str(e)}",
            "data": None
        }), 500
    
# @main.route("/attempts", methods=["POST"])
# def create_attempt():
#     """Create a new attempt and return its ID."""
#     attempt = Attempt()
#     db.session.add(attempt)
#     db.session.commit()
#     return jsonify({"message": "Attempt created", "attempt_id": attempt.id}), 201

# @main.route('/attempts', methods=["GET"])
# def getAttemptPaginated():
#     page = request.args.get('page', 1, type=int)
#     per_page = request.args.get('per_page', 5, type=int)

#     pagination = Attempt.query.paginate(page=page, per_page=per_page, error_out=False)

#     results = [
#         {
#             "id": attempt.id,
#             "score": attempt.total_score,
#             "created_at": attempt.created_at.isoformat(),
#         }
#         for attempt in pagination.items
#     ]

#     return jsonify({
#     'success': True,
#     'results': results,
#     'totalCount': pagination.total,
#     'currentPage': pagination.page,
#     'pageSize': pagination.per_page,
#     'totalPages': pagination.pages
# })

# @main.route('/attempts', methods=["GET"])
# def getAttemptPaginated():
#     page = request.args.get('page', 1, type=int)
#     per_page = request.args.get('per_page', 5, type=int)

#     pagination = Attempt.query.paginate(page=page, per_page=per_page, error_out=False)

#     results = [
#         {
#             "id": attempt.id,
#             "score": attempt.total_score,
#             "created_at": attempt.created_at.isoformat(),
#         }
#         for attempt in pagination.items
#     ]

#     return jsonify({
#     'success': True,
#     'results': results,
#     'totalCount': pagination.total,
#     'currentPage': pagination.page,
#     'pageSize': pagination.per_page,
#     'totalPages': pagination.pages
# })

# @main.route("/questions", methods=["POST"])
# def add_question():
#     """
#     Add a question (global, not tied to attempt).
#     Expected JSON:
#     {
#         "description": "What is 2+2?",
#         "choice_1": "2",
#         "choice_2": "3",
#         "choice_3": "4",
#         "choice_4": "5"
#     }
#     """
#     data = request.get_json()
#     question = Question(
#         description=data["description"],
#         choice_1=data["choice_1"],
#         choice_2=data["choice_2"],
#         choice_3=data["choice_3"],
#         choice_4=data["choice_4"]
#     )
#     db.session.add(question)
#     db.session.commit()

#     return jsonify({
#         "message": "Question added",
#         "question_id": question.id
#     }), 201


# @main.route("/questions", methods=["GET"])
# def get_questions():
#     """Retrieve all available questions (not tied to any attempt)."""
#     questions = Question.query.all()
#     data = []
#     for q in questions:
#         data.append({
#             "id": q.id,
#             "description": q.description,
#             "choices": [q.choice_1, q.choice_2, q.choice_3, q.choice_4]
#         })
#     return jsonify(data)

# @main.route("/attempts/<int:attempt_id>", methods=["GET"])
# def get_attempt_details(attempt_id):
#     attempt = Attempt.query.get_or_404(attempt_id)

#     answers = [
#         {
#             "question_id": ans.question_id,
#             "choice_chosen": ans.choice_chosen
#         } for ans in attempt.answers
#     ]
#     attempt.calculate_total_score()
#     db.session.commit()
#     return jsonify({
#         "attempt_id": attempt.id,
#         "created_at": attempt.created_at,
#         "total_score": attempt.total_score,
#         "answers": answers
#     })

# @main.route("/attempts/<int:attempt_id>/answers", methods=["POST"])
# def submit_answer(attempt_id):
#     """
#     Submit an answer for a specific attempt.
#     Expected JSON:
#     {
#         "question_id": 1,
#         "choice_chosen": "A"
#     }
#     """
#     data = request.get_json()

#     # Validate attempt existence
#     attempt = Attempt.query.get(attempt_id)
#     if not attempt:
#         return jsonify({"error": "Attempt not found"}), 404

#     # Validate question existence
#     question = Question.query.get(data.get("question_id"))
#     if not question:
#         return jsonify({"error": "Question not found"}), 404

#     # Create new Answer entry
#     answer = Answer(
#         attempt_id=attempt_id,
#         question_id=data.get("question_id"),
#         choice_chosen=data.get("choice_chosen")
#     )

#     db.session.add(answer)
#     db.session.commit()

#     return jsonify({
#         "message": "Answer submitted successfully",
#         "answer": {
#             "id": answer.id,
#             "attempt_id": attempt.id,
#             "question_id": question.id,
#             "choice_chosen": answer.choice_chosen
#         }
#     }), 201

# @main.route("/attempts/<int:attempt_id>/answers/bulk", methods=["POST"])
# def submit_answers_bulk(attempt_id):
#     """
#     Submit multiple answers for a specific attempt.
#     Expected JSON:
#     [
#         {
#             "question_id": 1,
#             "choice_chosen": "A"
#         },
#         {
#             "question_id": 2,
#             "choice_chosen": "B"
#         }
#     ]
#     """
#     data = request.get_json()

#     if not isinstance(data, list):
#         return jsonify({"error": "Expected a list of answers"}), 400

#     attempt = Attempt.query.get(attempt_id)
#     if not attempt:
#         return jsonify({"error": "Attempt not found"}), 404

#     answers = []
#     errors = []
    
#     for idx, answer_data in enumerate(data):
#         if not isinstance(answer_data, dict):
#             errors.append(f"Item {idx} is not a valid object")
#             continue
            
#         question_id = answer_data.get("question_id")
#         choice_chosen = answer_data.get("choice_chosen")
        
#         if not question_id:
#             errors.append(f"Item {idx} missing 'question_id'")
#             continue
            
#         if not choice_chosen:
#             errors.append(f"Item {idx} missing 'choice_chosen'")
#             continue
        
#         question = Question.query.get(question_id)
#         if not question:
#             errors.append(f"Question with id {question_id} not found (item {idx})")
#             continue
        
#         answer = Answer(
#             attempt_id=attempt_id,
#             question_id=question_id,
#             choice_chosen=choice_chosen
#         )
#         answers.append(answer)
#         db.session.add(answer)
    
#     if errors:
#         db.session.rollback()
#         return jsonify({
#             "error": "Some answers could not be processed",
#             "details": errors
#         }), 400
    
#     try:
#         db.session.commit()
#     except Exception as e:
#         db.session.rollback()
#         return jsonify({"error": "Database error", "details": str(e)}), 500

#     return jsonify({
#         "message": f"Successfully submitted {len(answers)} answers",
#         "submitted_answers": [
#             {
#                 "question_id": answer.question_id,
#                 "choice_chosen": answer.choice_chosen
#             }
#             for answer in answers
#         ]
#     }), 201