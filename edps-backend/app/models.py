from app import db
import uuid
from sqlalchemy.dialects.postgresql import JSON
import datetime
# from werkzeug.security import generate_password_hash, check_password_hash

class User(db.Model):
    __tablename__ = 'users'
    
    id_user = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    username = db.Column(db.String(80), unique=True, nullable=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    role = db.Column(db.Enum('LPMI', 'UPPS', 'ADMIN', 'SUPERADMIN', 'PRODI'), nullable=False)
    id_prodi = db.Column(db.String(36), db.ForeignKey("prodi.id_prodi"), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)

    prodi = db.relationship("Prodi", back_populates="user")
    
    def to_dict(self):
        return {
            'id_user': self.id_user,
            'username': self.username,
            'email': self.email,
            'role': self.role,
            'is_active': self.is_active
        }
  
class Regulasi(db.Model):
    __tablename__ = "regulasi"

    id_regulasi = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    nama_regulasi = db.Column(db.String(100), nullable=False)
    deskripsi_regulasi = db.Column(db.Text, nullable=True)

    versi_list = db.relationship("VersiRegulasi", back_populates="regulasi", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Regulasi {self.id_regulasi} - {self.nama_regulasi}>"

class VersiRegulasi(db.Model):
    __tablename__ = "versi_regulasi"

    id_regulasi = db.Column(db.String(36), db.ForeignKey("regulasi.id_regulasi"), nullable=False)
    id_versi = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    versi_regulasi = db.Column(db.Float, nullable=False)
    tahun_berlaku = db.Column(db.Integer)
    status_aktif = db.Column(db.Boolean, default=True, nullable=False)
    total_max_bobot = db.Column(db.Float, default=0, nullable=False) 

    regulasi = db.relationship("Regulasi", back_populates="versi_list")
    pertanyaan = db.relationship("Pertanyaan", back_populates="versi_regulasi", cascade="all, delete-orphan")
    periode = db.relationship("Periode", back_populates="versi_regulasi", cascade="all, delete-orphan")

    def update_total_max_bobot(self):
        total = 0
        for question in self.pertanyaan:
            total += question.bobot
        self.total_max_bobot = total
        return total

    def __repr__(self):
        return f"<Regulasi {self.id_regulasi} - {self.versi_regulasi}>"

class Prodi(db.Model):
    __tablename__ = "prodi"

    id_prodi = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    kode_prodi = db.Column(db.String(150))
    nama_prodi = db.Column(db.String(150))
    fakultas = db.Column(db.String(150))
    status_aktif = db.Column(db.Boolean, default=True, nullable=False)
    regulasi_ids = db.Column(JSON, nullable=False)

    periode = db.relationship("Periode", back_populates="prodi", cascade="all, delete-orphan")
    user = db.relationship("User", back_populates="prodi", cascade="all, delete-orphan")
    def __repr__(self):
        return f"<Regulasi {self.id_prodi} - {self.nama_prodi}>"


class Pertanyaan(db.Model):
    __tablename__ = "pertanyaan"

    id_pertanyaan = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    id_versi = db.Column(db.String(36), db.ForeignKey("versi_regulasi.id_versi"), nullable=False)
    deskripsi_pertanyaan = db.Column(db.Text)
    bobot = db.Column(db.Float) 
    kode_kriteria = db.Column(db.String(50), nullable=False) 
    # kode_BANPT = db.Column(db.String(10)) 
    # kode_LAMINFOKOM = db.Column(db.String(50)) 
    # jenis = db.Column(db.Enum('Input', 'Process', 'Output/Outcome'), nullable=False) 
    # kode_butir = db.Column(db.String(50)) 
    elemen_penilaian_lam = db.Column(db.Text)

    versi_regulasi = db.relationship("VersiRegulasi", back_populates="pertanyaan")
    indikator_jawaban = db.relationship("IndikatorJawaban", back_populates="pertanyaan", cascade="all, delete-orphan")
    jawaban_user = db.relationship("JawabanUser", back_populates="pertanyaan", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Pertanyaan {self.id_pertanyaan}>"


class IndikatorJawaban(db.Model):
    __tablename__ = "indikator_jawaban"

    id_indikator = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    id_pertanyaan = db.Column(db.String(36), db.ForeignKey("pertanyaan.id_pertanyaan"), nullable=False)
    skor = db.Column(db.Integer)
    label = db.Column(db.String(50))
    deskripsi = db.Column(db.Text)

    pertanyaan = db.relationship("Pertanyaan", back_populates="indikator_jawaban")

    def __repr__(self):
        return f"<Indikator {self.id_indikator} ({self.label})>"


class Periode(db.Model):
    __tablename__ = "periode"

    id_periode = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    id_versi = db.Column(db.String(36), db.ForeignKey("versi_regulasi.id_versi"), nullable=False)
    id_prodi = db.Column(db.String(36), db.ForeignKey("prodi.id_prodi"), nullable=False)
    nama_periode = db.Column(db.String(50), nullable=True)
    tahun_berlaku = db.Column(db.String(9), nullable=False)
    tanggal_pengisian = db.Column(db.DateTime)
    tanggal_validasi = db.Column(db.DateTime)
    tanggal_review = db.Column(db.DateTime)
    tanggal_mulai = db.Column(db.DateTime, nullable=False)
    tanggal_selesai = db.Column(db.DateTime, nullable=False)
    tanggal_kadaluarsa = db.Column(db.DateTime, nullable=False)
    id_pengisi = db.Column(db.String(36), db.ForeignKey("users.id_user"), nullable=True)
    id_validator = db.Column(db.String(36), db.ForeignKey("users.id_user"), nullable=True)
    status = db.Column(db.Enum('Submitted', 'Reviewed', 'In Progress', 'Validating', 'Validated'),  default='In Progress')
    total_skor_lpmi = db.Column(db.Float, default=0, nullable=False)
    total_skor_prodi = db.Column(db.Float, default=0, nullable=False)
    total_skor_assesor = db.Column(db.Float, default=0, nullable=False)

    jawaban_user = db.relationship("JawabanUser", back_populates="periode", cascade="all, delete-orphan")
    versi_regulasi = db.relationship("VersiRegulasi", back_populates="periode")
    prodi = db.relationship("Prodi", back_populates="periode")
    pengisi = db.relationship("User", foreign_keys=[id_pengisi])
    validator = db.relationship("User", foreign_keys=[id_validator])

    def update_totals(self):
        """Update both stored total scores for this period"""
        total_prodi = 0
        total_lpmi = 0
        total_assesor = 0
        
        for jawaban in self.jawaban_user:
            if jawaban.skor_prodi is not None:
                total_prodi += jawaban.skor_prodi

            if jawaban.skor_lpmi is not None:
                total_lpmi += jawaban.skor_lpmi

            if jawaban.skor_assesor is not None:
                total_assesor += jawaban.skor_assesor
        
        self.total_skor_prodi = total_prodi
        self.total_skor_lpmi = total_lpmi
        self.total_skor_assesor = total_assesor
        return total_prodi, total_lpmi, total_assesor

    def __repr__(self):
        return f"<Periode {self.nama_periode}>"


class JawabanUser(db.Model):
    __tablename__ = "jawaban_user"

    id_jawaban = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    id_pertanyaan = db.Column(db.String(36), db.ForeignKey("pertanyaan.id_pertanyaan"), nullable=False)
    id_periode = db.Column(db.String(36), db.ForeignKey("periode.id_periode"), nullable=True)
    
    id_indikator_prodi = db.Column(db.String(36), db.ForeignKey("indikator_jawaban.id_indikator"), nullable=True)
    skor_prodi = db.Column(db.Float, nullable=True)

    id_indikator_lpmi = db.Column(db.String(36), db.ForeignKey("indikator_jawaban.id_indikator"), nullable=True)
    skor_lpmi = db.Column(db.Float, nullable=True)
    note_lpmi = db.Column(db.Text, nullable=True)

    id_indikator_assesor = db.Column(db.String(36), db.ForeignKey("indikator_jawaban.id_indikator"), nullable=True)
    skor_assesor = db.Column(db.Float, nullable=True)
    note_assesor = db.Column(db.Text, nullable=True)

    pertanyaan = db.relationship("Pertanyaan", back_populates="jawaban_user")
    periode = db.relationship("Periode", back_populates="jawaban_user")
    indikator_prodi = db.relationship("IndikatorJawaban",foreign_keys=[id_indikator_prodi])
    indikator_lpmi = db.relationship("IndikatorJawaban",foreign_keys=[id_indikator_lpmi])
    indikator_assesor = db.relationship("IndikatorJawaban",foreign_keys=[id_indikator_assesor])
    uploads = db.relationship("UploadFile", back_populates="jawaban_user", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<JawabanUser {self.id_jawaban}>"

class UploadFile(db.Model):
    __tablename__ = "upload_file"
    
    id_file = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    id_jawaban = db.Column(db.String(36), db.ForeignKey("jawaban_user.id_jawaban"), nullable=False)
    file_name = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(255), nullable=False)
    file_size = db.Column(db.Integer, nullable=True)
    uploaded_at = db.Column(db.DateTime, default=datetime.datetime.utcnow())

    jawaban_user = db.relationship("JawabanUser", back_populates="uploads")