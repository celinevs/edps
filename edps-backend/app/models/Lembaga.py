from app import db
import uuid

class Lembaga(db.Model):
    __tablename__ = "lembaga"

    id_lembaga = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nama_lembaga = db.Column(db.String(100), nullable=False)

    question_set = db.relationship("QuestionSet", back_populates="lembaga", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            'id_lembaga': self.id_lembaga,
            'nama_lembaga': self.nama_lembaga,
        }