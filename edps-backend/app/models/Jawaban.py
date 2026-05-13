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

class EmbaDosen(db.Model):
    __tablename__ = "emba_dosen"

    id_jawaban_dosen = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    id_akreditasi = db.Column(db.String(36), db.ForeignKey("akreditasi.id_akreditasi"), nullable=True)
    user_role = db.Column(db.Enum('PRODI', 'LPMI', 'ASSESOR'))

    dosen_total = db.Column(db.Integer, nullable=True)
    dosen_tetap = db.Column(db.Integer, nullable=True)
    dosen_doktor = db.Column(db.Integer, nullable=True)
    dosen_magister = db.Column(db.Integer, nullable=True)
    dosen_guru_besar = db.Column(db.Integer, nullable=True)
    dosen_lektor_kepala = db.Column(db.Integer, nullable=True)
    dosen_lektor = db.Column(db.Integer, nullable=True)
    dosen_publikasi = db.Column(db.Integer, nullable=True)
    dosen_sertifikat = db.Column(db.Integer, nullable=True)

    akreditasi = db.relationship("Akreditasi", back_populates="emba_dosen")

    def to_dict(self):
        return {
        "id_jawaban_dosen": self.id_jawaban_dosen,
        "dosen_total": self.dosen_total,
        "dosen_tetap": self.dosen_tetap,
        "dosen_doktor": self.dosen_doktor,
        "dosen_magister": self.dosen_magister,
        "dosen_guru_besar": self.dosen_guru_besar,
        "dosen_lektor_kepala": self.dosen_lektor_kepala,
        "dosen_lektor": self.dosen_lektor,
        "dosen_publikasi": self.dosen_publikasi,
        "dosen_sertifikat": self.dosen_sertifikat,
        "user_role": self.user_role
    }