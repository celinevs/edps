from app import db
import uuid

class QuestionSet(db.Model):
    __tablename__ = "question_set"

    id_lembaga = db.Column(db.Integer, db.ForeignKey("lembaga.id_lembaga"), nullable=False)
    id_qs = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    question_set = db.Column(db.Float, nullable=False)
    tanggal_aktif = db.Column(db.DateTime)
    tahun_berlaku = db.Column(db.String(9))
    status_aktif = db.Column(db.Boolean, default=True, nullable=False)
    total_max_bobot = db.Column(db.Float, default=0, nullable=False) 
    total_questions = db.Column(db.Integer, default=0)

    label_link = db.Column(db.String(255), nullable=True)
    link = db.Column(db.String(255), nullable=True)
    gambar_indikator = db.Column(db.String(255), nullable=True) 
    deskripsi_gambar = db.Column(db.String(255), nullable=True)

    lembaga = db.relationship("Lembaga", back_populates="question_set")
    lam_infokom = db.relationship("LamInfokom", back_populates="question_set", cascade="all, delete-orphan")
    lam_emba = db.relationship("LamEmba", back_populates="question_set", cascade="all, delete-orphan")
    akreditasi = db.relationship("Akreditasi", back_populates="question_set", cascade="all, delete-orphan")

    def update_total_max_bobot(self):
        total = 0
        total_questions = 0
        if self.id_lembaga == 1:
            for question in self.lam_infokom:
                total += question.bobot 
                total_questions += 1    
        else:
            for question in self.lam_emba:
                total += question.bobot
                total_questions += 1
        
        self.total_max_bobot = total
        self.total_questions = total_questions
        return total
    