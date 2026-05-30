from flask import Blueprint, request, send_file, make_response, send_from_directory
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
import os
from werkzeug.utils import secure_filename
import mimetypes
from flask_cors import cross_origin

UPLOAD_FOLDER = os.getenv("UPLOAD_FOLDER", "/app/uploads")

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
                "no_kriteria": p.no_butir,
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
@role_required('ADMIN', 'SUPERADMIN')
@jwt_required()
def import_question_csv():
    try:
        file = request.files['file']
        gambar = request.files.get('gambar')

        id_lembaga = int(request.form.get("id_lembaga"))
        question_set_version = float(request.form.get("question_set"))
        tahun_mulai = request.form.get("tahun_mulai")
        tahun_akhir = request.form.get("tahun_akhir")
        label_link = request.form.get("label_link")
        link = request.form.get("link")
        deskripsi_gambar = request.form.get("deskripsi_gambar")

        existing = QuestionSet.query.filter(
            QuestionSet.id_lembaga == id_lembaga,
            QuestionSet.question_set == question_set_version
        ).first()
        
        if existing:
            return error_response(
                "Question set version already exists for this institution",
                400
            )
        
        filename = secure_filename(file.filename)
        path = os.path.join(UPLOAD_FOLDER, filename)

        gambar_path = None
        if gambar:
            gambar_filename = secure_filename(gambar.filename)
            gambar_path = os.path.join(UPLOAD_FOLDER, gambar_filename)
            os.makedirs(os.path.dirname(gambar_path), exist_ok=True)
            gambar.save(gambar_path)

        qs = QuestionSet(
            id_lembaga=id_lembaga,
            question_set=question_set_version,
            tahun_berlaku=f'{tahun_mulai}/{tahun_akhir}',
            tanggal_aktif=datetime.utcnow(),
            status_aktif=True,
            csv_path = path,
            csv_name = filename,

            label_link=label_link,
            link=link,
            gambar_path=gambar_path,
            deskripsi_gambar=deskripsi_gambar
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
        
        if qs.id_lembaga == 1:
            required_columns = [
                "q_no",
                "no_butir",
                "kode_kriteria",
                "kriteria",
                "jenis",
                "elemen_penilaian_lam",
                "deskripsi_pertanyaan",
                "bobot",
                "jawaban_1",
                "jawaban_2",
                "jawaban_3",
                "jawaban_4"
                ]
        elif qs.id_lembaga == 2:
            required_columns = [
                "q_no",
                "kode_dimensi",
                "kode_kriteria",
                "kriteria",
                "dimensi",
                "deskripsi_pertanyaan",
                "mandatory"
                ]
        
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            return error_response(f"Invalid file format. Missing required columns: {missing_columns}", 400)
        
        kriteria_mapping = (df.groupby("kode_kriteria")["kriteria"].nunique())
        
        invalid_kriteria = kriteria_mapping[kriteria_mapping > 1]
        
        if not invalid_kriteria.empty:
            invalid_details = []
            for kode in invalid_kriteria.index:
                values = (
                    df[df["kode_kriteria"] == kode]["kriteria"]
                    .dropna()
                    .unique()
                    .tolist()
                    )
                invalid_details.append(f"{kode}: {values}")
                
            return error_response(f"kode_kriteria has multiple kriteria values -> {'; '.join(invalid_details)}",400)

        for index, row in df.iterrows():
            if id_lembaga == 1:
                if pd.isnull(row.get("q_no")):
                    return error_response(f"Row {index+1}: q_no is required", 400)
                
                if pd.isnull(row.get("bobot")):
                    return error_response(f"Row {index+1}: bobot is required", 400)
                
                row = row.where(pd.notnull(row), None)
                
                pertanyaan = LamInfokom(
                    id_qs=qs.id_qs,
                    q_no=int(row.get("q_no")),
                    no_butir = row.get("no_butir"),
                    kode_kriteria=row.get("kode_kriteria"),
                    kriteria=row.get("kriteria"),
                    elemen_penilaian_lam=row.get("elemen_penilaian_lam"),
                    deskripsi_pertanyaan=row.get("deskripsi_pertanyaan"),
                    jenis = row.get('jenis'),
                    bobot=float(row.get("bobot", 0)),
                    jawaban_1=row.get("jawaban_1"),
                    jawaban_2=row.get("jawaban_2"),
                    jawaban_3=row.get("jawaban_3"),
                    jawaban_4=row.get("jawaban_4"),
                )

            elif id_lembaga == 2:
                mandatory_val = str(row.get("mandatory")).lower()
                if mandatory_val not in ["true", "false"]:
                    return error_response(
                        f"Row {index+1}: mandatory must be 'true' or 'false'", 400)
                
                pertanyaan = LamEmba(
                    id_qs=qs.id_qs,
                    q_no=int(row.get("q_no")),
                    kode_dimensi = row.get("kode_dimensi"),
                    kode_kriteria=row.get("kode_kriteria"),
                    kriteria=row.get("kriteria"),
                    dimensi=row.get("dimensi"),
                    deskripsi_pertanyaan=row.get("deskripsi_pertanyaan"),
                    bobot=float(row.get("bobot", 1)),
                    mandatory=str(row.get("mandatory")).lower() == "true"
                )

            db.session.add(pertanyaan)
            inserted += 1
        qs.update_total_max_bobot()

        # Reset file pointer to beginning
        file.seek(0)
        file.save(path)

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
@role_required('ADMIN', 'SUPERADMIN')
@jwt_required()
def update_question_csv(id_qs):
    try:
        qs = QuestionSet.query.get(id_qs)
        if not qs:
            return error_response("Question set not found", 404)
        
        new_version = float(request.form.get("question_set", qs.question_set))
        label_link = request.form.get("label_link")
        link = request.form.get("link")
        deskripsi_gambar = request.form.get("deskripsi_gambar")
        gambar = request.files.get("gambar")
        
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

        file = request.files.get('file')

        old_path = qs.csv_path
        qs.question_set = new_version
        qs.tahun_berlaku = request.form.get("tahun_berlaku", qs.tahun_berlaku)

        qs.label_link = label_link or qs.label_link
        qs.link = link or qs.link
        qs.deskripsi_gambar = deskripsi_gambar or qs.deskripsi_gambar

        if gambar:
            if qs.gambar_path:
                gambar.save(qs.gambar_path)
            else:
                gambar_filename = secure_filename(gambar.filename)
                gambar_path = os.path.join(UPLOAD_FOLDER, gambar_filename)
                os.makedirs(os.path.dirname(gambar_path), exist_ok=True)
                gambar.save(gambar_path)

        is_used = db.session.query(
            exists().where(Akreditasi.id_qs == id_qs)
        ).scalar()

        if is_used and file:
            return error_response("Question set is already used in accreditation and cannot be modified",400)
        
        if file:
            qs.csv_name = file.filename

            if file.filename.endswith('.xlsx'):
                df = pd.read_excel(file)
            elif file.filename.endswith('.csv'):
                df = pd.read_csv(file)
            else:
                return error_response("File format must be .csv or .xlsx", 400)
            
            if df["q_no"].duplicated().any():
                dup = df[df["q_no"].duplicated()]["q_no"].tolist()
                return error_response(f"Duplicate q_no found in file: {dup}",400)
            
            if qs.id_lembaga == 1:
                required_columns = [
                "q_no",
                "no_butir",
                "kode_kriteria",
                "kriteria",
                "jenis",
                "elemen_penilaian_lam",
                "deskripsi_pertanyaan",
                "bobot",
                "jawaban_1",
                "jawaban_2",
                "jawaban_3",
                "jawaban_4"
                ]
            elif qs.id_lembaga == 2:
                required_columns = [
                "q_no",
                "kode_dimensi",
                "kode_kriteria",
                "kriteria",
                "dimensi",
                "deskripsi_pertanyaan",
                "mandatory"
                ]
            missing_columns = [col for col in required_columns if col not in df.columns]
            if missing_columns:
                return error_response(f"Invalid file format. Missing required columns: {missing_columns}", 400)
            
            kriteria_mapping = (df.groupby("kode_kriteria")["kriteria"].nunique())
        
            invalid_kriteria = kriteria_mapping[kriteria_mapping > 1]
        
            if not invalid_kriteria.empty:
                invalid_details = []
                for kode in invalid_kriteria.index:
                    values = (
                    df[df["kode_kriteria"] == kode]["kriteria"]
                    .dropna()
                    .unique()
                    .tolist()
                    )
                    invalid_details.append(f"{kode}: {values}")
                
                return error_response(f"kode_kriteria has multiple kriteria values -> {'; '.join(invalid_details)}",400)

            
            if qs.id_lembaga == 1:
                LamInfokom.query.filter_by(id_qs=id_qs).delete()
            
            elif qs.id_lembaga == 2:
                LamEmba.query.filter_by(id_qs=id_qs).delete()
            
            inserted = 0
            for index, row in df.iterrows():

                if qs.id_lembaga == 1:
                    if pd.isnull(row.get("q_no")):
                        return error_response(f"Row {index+1}: q_no is required", 400)
                
                    if pd.isnull(row.get("bobot")):
                        return error_response(f"Row {index+1}: bobot is required", 400)
                    
                    row = row.where(pd.notnull(row), None)
                    
                    pertanyaan = LamInfokom(
                    id_qs=id_qs,
                    q_no=int(row.get("q_no")),
                    kode_kriteria=row.get("kode_kriteria"),
                    kriteria=row.get("kriteria"),
                    elemen_penilaian_lam=row.get("elemen_penilaian_lam"),
                    deskripsi_pertanyaan=row.get("deskripsi_pertanyaan"),
                    jenis = row.get('jenis'),
                    bobot=float(row.get("bobot", 0)),
                    jawaban_1=row.get("jawaban_1"),
                    jawaban_2=row.get("jawaban_2"),
                    jawaban_3=row.get("jawaban_3"),
                    jawaban_4=row.get("jawaban_4"),
                )
                elif qs.id_lembaga == 2:
                    mandatory_val = str(row.get("mandatory")).lower()
                    if mandatory_val not in ["true", "false"]:
                        return error_response(f"Row {index+1}: mandatory must be 'true' or 'false'", 400)
                    
                    row = row.where(pd.notnull(row), None)
                    
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

            qs.update_total_max_bobot()
            
            # Reset file pointer to beginning
            file.seek(0)
            file.save(old_path)

        db.session.commit()


        return success_response(
            data= None,
            message="Question set successfully updated"
        )

    except Exception as e:
        db.session.rollback()
        return handle_exception(e)

#THIS IS FOR DEVELOPMENT ONLY, MODIFY THIS WHEN PRODUCTION
@pertanyaan_bp.route("/uploads/<path:filename>")
def serve_uploads(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)
#---------------------------------------------------------

@pertanyaan_bp.route("/pertanyaan/download-csv/<id_qs>", methods=["GET"])
@cross_origin(expose_headers=["Content-Disposition"])
def download_csv(id_qs):

    qs = QuestionSet.query.get(id_qs)

    if not qs:
        return error_response("Question set not found", 404)
    
    if not qs.csv_path:
        return error_response("CSV path is empty", 404)

    if not os.path.exists(qs.csv_path):
        return error_response("File not found", 404)
    
    mime_type, _ = mimetypes.guess_type(qs.csv_path)

    response = make_response(send_file(
        qs.csv_path,
        as_attachment=True,
        mimetype=mime_type or "application/octet-stream",
        download_name=qs.csv_name
    ))

    response.headers["Access-Control-Allow-Credentials"] = "true"
    response.headers["Cache-Control"] = "no-store"

    return response