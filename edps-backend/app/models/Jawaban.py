from app import db
import uuid
import datetime

class Jawaban(db.Model):
    __tablename__ = "jawaban"

    id_jawaban = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    id_qs = db.Column(db.String(36), db.ForeignKey("question_set.id_qs"), nullable=False)
    q_no = db.Column(db.Integer)
    id_akreditasi = db.Column(db.String(36), db.ForeignKey("akreditasi.id_akreditasi"), nullable=True)
    
    jawaban_prodi = db.Column(db.Integer, nullable=True)
    skor_prodi = db.Column(db.Float, nullable=True)

    jawaban_lpmi = db.Column(db.Integer, nullable=True)
    skor_lpmi = db.Column(db.Float, nullable=True)
    note_lpmi = db.Column(db.Text, nullable=True)

    jawaban_assesor = db.Column(db.Integer, nullable=True)
    skor_assesor = db.Column(db.Float, nullable=True)
    note_assesor = db.Column(db.Text, nullable=True)

    akreditasi = db.relationship("Akreditasi", back_populates="jawaban")
    uploads = db.relationship("UploadFile", back_populates="jawaban", cascade="all, delete-orphan")


class UploadFile(db.Model):
    __tablename__ = "upload_file"
    
    id_file = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    id_jawaban = db.Column(db.String(36), db.ForeignKey("jawaban.id_jawaban"), nullable=False)
    file_name = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(255), nullable=False)
    file_size = db.Column(db.Integer, nullable=True)
    uploaded_at = db.Column(db.DateTime, default=datetime.datetime.utcnow())

    jawaban = db.relationship("Jawaban", back_populates="uploads")