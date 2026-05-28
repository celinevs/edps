from app import db
import uuid
from sqlalchemy.dialects.postgresql import JSON

class Prodi(db.Model):
    __tablename__ = "prodi"

    id_prodi = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    kode_prodi = db.Column(db.String(150))
    nama_prodi = db.Column(db.String(150))
    id_fakultas = db.Column(db.String(36), db.ForeignKey("fakultas.id_fakultas"), nullable=False)
    status_aktif = db.Column(db.Boolean, default=True, nullable=False)
    lembaga_ids = db.Column(JSON, nullable=False)

    akreditasi = db.relationship("Akreditasi", back_populates="prodi", cascade="all, delete-orphan")
    user = db.relationship("User", back_populates="prodi", cascade="all, delete-orphan")
    fakultas = db.relationship("Fakultas", back_populates="prodi")

class Fakultas(db.Model):
    __tablename__ = "fakultas"

    id_fakultas = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    nama_fakultas = db.Column(db.String(150))

    prodi = db.relationship("Prodi", back_populates="fakultas", cascade="all, delete-orphan")
    user = db.relationship("User", back_populates="fakultas", cascade="all, delete-orphan")
