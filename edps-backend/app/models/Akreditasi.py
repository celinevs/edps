from app import db
import uuid

class Akreditasi(db.Model):
    __tablename__ = "akreditasi"

    id_akreditasi = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    id_qs = db.Column(db.String(36), db.ForeignKey("question_set.id_qs"), nullable=False)
    id_prodi = db.Column(db.String(36), db.ForeignKey("prodi.id_prodi"), nullable=False)
    nama_akreditasi = db.Column(db.String(50), nullable=True)
    tahun_berlaku = db.Column(db.String(9), nullable=False, unique=True)

    tanggal_pengisian = db.Column(db.DateTime)
    tanggal_validasi = db.Column(db.DateTime)
    tanggal_review = db.Column(db.DateTime)

    tanggal_mulai = db.Column(db.DateTime, nullable=False)
    tanggal_selesai_prodi = db.Column(db.DateTime, nullable=False)
    tanggal_selesai_lpmi = db.Column(db.DateTime, nullable=False)
    # tanggal_kadaluarsa = db.Column(db.DateTime, nullable=False)

    progress_lpmi = db.Column(db.Float, default=0)
    progress_prodi = db.Column(db.Float, default=0)
    progress_assesor = db.Column(db.Float, default=0)

    id_pengisi = db.Column(db.String(36), db.ForeignKey("users.id_user"), nullable=True)
    id_validator = db.Column(db.String(36), db.ForeignKey("users.id_user"), nullable=True)
    
    status = db.Column(db.Enum('Submitted', 'Reviewed', 'In Progress', 'Validating', 'Validated', 'Reviewing'),  default='In Progress')
    
    total_skor_lpmi = db.Column(db.Float, default=0, nullable=False)
    total_skor_prodi = db.Column(db.Float, default=0, nullable=False)
    total_skor_assesor = db.Column(db.Float, default=0, nullable=False)

    evaluasi_integrasi = db.Column(db.Text, nullable=True)
    rekomendasi_ak = db.Column(db.Text, nullable=True)
    catatan_assesor = db.Column(db.Text, nullable=True)

    jawaban = db.relationship("Jawaban", back_populates="akreditasi", cascade="all, delete-orphan")
    question_set = db.relationship("QuestionSet", back_populates="akreditasi")
    prodi = db.relationship("Prodi", back_populates="akreditasi")
    pengisi = db.relationship("User", foreign_keys=[id_pengisi])
    validator = db.relationship("User", foreign_keys=[id_validator])
    emba_dosen = db.relationship("EmbaDosen", back_populates="akreditasi")

    def update_totals(self):
        """Update both stored total scores for this period"""
        total_prodi = 0
        total_lpmi = 0
        total_assesor = 0
        
        for jawaban in self.jawaban:
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
    
    def update_progress(self):
        total_questions = self.question_set.total_questions or 0
        if total_questions == 0:
            self.progress_prodi = 0
            self.progress_lpmi = 0
            self.progress_assesor = 0
            return
        
        answered_prodi = sum(1 for j in self.jawaban if j.jawaban_prodi is not None)
        answered_lpmi = sum(1 for j in self.jawaban if j.jawaban_lpmi is not None)
        answered_assesor = sum(1 for j in self.jawaban if j.jawaban_assesor is not None)
        
        self.progress_prodi = (answered_prodi / total_questions) * 100
        self.progress_lpmi = (answered_lpmi / total_questions) * 100
        self.progress_assesor = (answered_assesor / total_questions) * 100
