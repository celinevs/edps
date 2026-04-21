from app import db
import uuid

class LamInfokom(db.Model):
    __tablename__ = "lam_infokom"

    id_qinfokom = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    id_qs = db.Column(db.String(36), db.ForeignKey("question_set.id_qs"), nullable=False)
    q_no = db.Column(db.Integer)
    kode_kriteria = db.Column(db.String(50), nullable=False)
    kriteria = db.Column(db.Text)
    elemen_penilaian_lam = db.Column(db.Text)
    deskripsi_pertanyaan = db.Column(db.Text)
    bobot = db.Column(db.Float)
    jawaban_1 = db.Column(db.Text)
    jawaban_2 = db.Column(db.Text)
    jawaban_3 = db.Column(db.Text)
    jawaban_4 = db.Column(db.Text)


    question_set = db.relationship("QuestionSet", back_populates="lam_infokom")
    # jawaban = db.relationship("Jawaban", back_populates="pertanyaan", cascade="all, delete-orphan")

    __table_args__ = (
        db.UniqueConstraint('id_qs', 'q_no', name='uq_infokom_q'),
    )

class LamEmba(db.Model):
    __tablename__ = "lam_emba"

    id_qemba = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    id_qs = db.Column(db.String(36), db.ForeignKey("question_set.id_qs"), nullable=False)
    q_no = db.Column(db.Integer, nullable=False)
    kode_kriteria = db.Column(db.String(50), nullable=False)
    kriteria = db.Column(db.Text)
    deskripsi_pertanyaan = db.Column(db.Text)
    bobot = db.Column(db.Float, nullable=False, default=1)
    mandatory = db.Column(db.Boolean, nullable=False)


    question_set = db.relationship("QuestionSet", back_populates="lam_emba")
    # jawaban_user = db.relationship("JawabanUser", back_populates="pertanyaan", cascade="all, delete-orphan")

    __table_args__ = (
        db.UniqueConstraint('id_qs', 'q_no', name='uq_emba_q'),
    )