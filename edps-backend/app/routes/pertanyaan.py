from flask import Blueprint, request
from app import db
# from app.models import Pertanyaan, Regulasi, IndikatorJawaban, VersiRegulasi
from app.models.QuestionSet import QuestionSet
from app.models.QuestionList import LamEmba, LamInfokom
from app.models.Akreditasi import Akreditasi
from app.utils.response_handler import success_response, error_response, handle_exception
from app.utils.decorator import role_required
import pandas as pd
from flask_jwt_extended import jwt_required
from datetime import datetime
from sqlalchemy import exists

pertanyaan_bp = Blueprint("pertanyaan", __name__)

def map_infokom_indikator(p):
    indikator = []

    jawaban_list = [
        (1, p.jawaban_1),
        (2, p.jawaban_2),
        (3, p.jawaban_3),
        (4, p.jawaban_4),
    ]

    for skor, deskripsi in jawaban_list:
        if deskripsi:
            indikator.append({
                "skor": skor,
                "deskripsi": deskripsi
            })

    return indikator

@pertanyaan_bp.route("/pertanyaan/<id_qs>", methods=["GET"])
@jwt_required()
def get_pertanyaan_by_qs(id_qs):
    try:
        qs = QuestionSet.query.get(id_qs)
        if not qs:
            return error_response(f"Question set dengan id {id_qs} tidak ditemukan", 404)
        
        results = []
        
        if qs.id_lembaga == 1:
            pertanyaan_list = LamInfokom.query.filter_by(id_qs=id_qs).all()
            
            for p in pertanyaan_list:
                results.append({
                "id_pertanyaan": p.id_qinfokom,
                "deskripsi_pertanyaan": p.deskripsi_pertanyaan,
                "bobot": p.bobot,
                "kode_kriteria": p.kode_kriteria,
                "kriteria": p.kriteria,
                "elemen_penilaian_lam": p.elemen_penilaian_lam,
                "q_no": p.q_no,
                "indikator_jawaban": map_infokom_indikator(p)
            })
        elif qs.id_lembaga == 2:
            pertanyaan_list = LamEmba.query.filter_by(id_qs=id_qs).all()
            for p in pertanyaan_list:
                results.append({
                    "q_no": p.q_no,
                    "id_pertanyaan": p.id_qemba,
                    "deskripsi_pertanyaan": p.deskripsi_pertanyaan,
                    "bobot": p.bobot,
                    "kode_kriteria": p.kode_kriteria,
                    "kriteria": p.kriteria,
                    'mandatory': p.mandatory,
                    "elemen_penilaian_lam": None,
                    "indikator_jawaban": [
                        {
                        "skor": 1,
                        "deskripsi": 'Melampaui'
                        },
                        {
                        "skor": 0,
                        "deskripsi": 'Tidak melampaui'
                        },
                        ]
                    })

        return success_response(
            data={
                "id_qs": id_qs,
                "nama_lembaga": qs.lembaga.nama_lembaga if qs.lembaga else None,
                "versi": qs.question_set,
                "jumlah_pertanyaan": len(results),
                "pertanyaan": results
            },
            message="Data pertanyaan berhasil diambil"
        )

    except Exception as e:
        return handle_exception(e)

@pertanyaan_bp.route("/pertanyaan/import-csv", methods=["POST"])
@jwt_required()
def import_question_csv():
    try:
        file = request.files['file']

        id_lembaga = int(request.form.get("id_lembaga"))
        question_set_version = float(request.form.get("question_set"))
        tahun_mulai = request.form.get("tahun_mulai")
        tahun_akhir = request.form.get("tahun_akhir")

        existing = QuestionSet.query.filter(
            QuestionSet.id_lembaga == id_lembaga,
            QuestionSet.question_set == question_set_version
        ).first()
        
        if existing:
            return error_response(
                "Question set version already exists for this institution",
                400
            )

        qs = QuestionSet(
            id_lembaga=id_lembaga,
            question_set=question_set_version,
            tahun_berlaku=f'{tahun_mulai}/{tahun_akhir}',
            tanggal_aktif=datetime.utcnow(),
            status_aktif=True
        )

        db.session.add(qs)
        db.session.flush()

        if file.filename.endswith('.xlsx'):
            df = pd.read_excel(file)
        elif file.filename.endswith('.csv'):
            df = pd.read_csv(file)
        else:
            return error_response(
                "File format must be .csv or .xlsx",
                400
            )

        inserted = 0

        if df["q_no"].duplicated().any():
            dup = df[df["q_no"].duplicated()]["q_no"].tolist()
            return error_response(
                f"Duplicate q_no found in file: {dup}",
                400
            )

        for _, row in df.iterrows():
            if id_lembaga == 1:
                pertanyaan = LamInfokom(
                    id_qs=qs.id_qs,
                    q_no=int(row.get("q_no")),
                    kode_kriteria=row.get("kode_kriteria"),
                    kriteria=row.get("kriteria"),
                    elemen_penilaian_lam=row.get("elemen_penilaian_lam"),
                    deskripsi_pertanyaan=row.get("deskripsi_pertanyaan"),
                    bobot=float(row.get("bobot", 0)),
                    jawaban_1=row.get("jawaban_1"),
                    jawaban_2=row.get("jawaban_2"),
                    jawaban_3=row.get("jawaban_3"),
                    jawaban_4=row.get("jawaban_4"),
                )

            elif id_lembaga == 2:
                pertanyaan = LamEmba(
                    id_qs=qs.id_qs,
                    q_no=int(row.get("q_no")),
                    kode_kriteria=row.get("kode_kriteria"),
                    kriteria=row.get("dimensi"),
                    deskripsi_pertanyaan=row.get("deskripsi_pertanyaan"),
                    bobot=float(row.get("bobot", 1)),
                    mandatory=str(row.get("mandatory")).lower() == "true"
                )

            db.session.add(pertanyaan)
            inserted += 1

        qs.update_total_max_bobot()

        db.session.commit()

        return success_response(
            data={
                "id_qs": qs.id_qs,
                "inserted": inserted
            },
            message="Question set and questions successfully created"
        )

    except Exception as e:
        db.session.rollback()
        return handle_exception(e)

@pertanyaan_bp.route("/pertanyaan/import-csv/<id_qs>", methods=["PUT"])
@jwt_required()
def update_question_csv(id_qs):
    try:
        qs = QuestionSet.query.get(id_qs)
        if not qs:
            return error_response("Question set not found", 404)
        
        new_version = float(request.form.get("question_set", qs.question_set))
        
        existing = QuestionSet.query.filter(
            QuestionSet.id_lembaga == qs.id_lembaga,
            QuestionSet.question_set == new_version,
            QuestionSet.id_qs != id_qs
        ).first()

        if existing:
            return error_response(
                "Question set version already exists for this institution",
                400
            )

        file = request.files['file']

        qs.question_set = new_version
        qs.tahun_berlaku = request.form.get("tahun_berlaku", qs.tahun_berlaku)

        if file.filename.endswith('.xlsx'):
            df = pd.read_excel(file)
        elif file.filename.endswith('.csv'):
            df = pd.read_csv(file)
        else:
            return error_response("File format must be .csv or .xlsx", 400)

        is_used = db.session.query(
            exists().where(Akreditasi.id_qs == id_qs)
        ).scalar()

        if is_used:
            return error_response(
                "Question set is already used in accreditation and cannot be modified",
                400
            )

        if df["q_no"].duplicated().any():
            dup = df[df["q_no"].duplicated()]["q_no"].tolist()
            return error_response(
                f"Duplicate q_no found in file: {dup}",
                400
            )

        if qs.id_lembaga == 1:
            LamInfokom.query.filter_by(id_qs=id_qs).delete()
        elif qs.id_lembaga == 2:
            LamEmba.query.filter_by(id_qs=id_qs).delete()

        inserted = 0

        for _, row in df.iterrows():
            if qs.id_lembaga == 1:
                pertanyaan = LamInfokom(
                    id_qs=id_qs,
                    q_no=int(row.get("q_no")),
                    kode_kriteria=row.get("kode_kriteria"),
                    kriteria=row.get("kriteria"),
                    elemen_penilaian_lam=row.get("elemen_penilaian_lam"),
                    deskripsi_pertanyaan=row.get("deskripsi_pertanyaan"),
                    bobot=float(row.get("bobot", 0)),
                    jawaban_1=row.get("jawaban_1"),
                    jawaban_2=row.get("jawaban_2"),
                    jawaban_3=row.get("jawaban_3"),
                    jawaban_4=row.get("jawaban_4"),
                )

            elif qs.id_lembaga == 2:
                pertanyaan = LamEmba(
                    id_qs=id_qs,
                    q_no=int(row.get("q_no")),
                    kode_kriteria=row.get("kode_kriteria"),
                    kriteria=row.get("dimensi"),
                    deskripsi_pertanyaan=row.get("deskripsi_pertanyaan"),
                    bobot=float(row.get("bobot", 1)),
                    mandatory=str(row.get("mandatory")).lower() == "true"
                )

            db.session.add(pertanyaan)
            inserted += 1

        # update aggregate
        qs.update_total_max_bobot()

        db.session.commit()

        return success_response(
            data={
                "id_qs": id_qs,
                "inserted": inserted
            },
            message="Question set successfully updated"
        )

    except Exception as e:
        db.session.rollback()
        return handle_exception(e)