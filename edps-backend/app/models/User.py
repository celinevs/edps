from app import db
import uuid
import datetime

class User(db.Model):
    __tablename__ = 'users'
    
    id_user = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    username = db.Column(db.String(80), unique=True, nullable=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    role = db.Column(db.Enum('LPMI', 'UPPS', 'ADMIN', 'SUPERADMIN', 'PRODI'), nullable=False)
    id_prodi = db.Column(db.String(36), db.ForeignKey("prodi.id_prodi"), nullable=True)
    id_fakultas = db.Column(db.String(36), db.ForeignKey("fakultas.id_fakultas"), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)

    prodi = db.relationship("Prodi", back_populates="user")
    fakultas = db.relationship("Fakultas", back_populates="user")
    
    def to_dict(self):
        return {
            'id_user': self.id_user,
            'username': self.username,
            'email': self.email,
            'role': self.role,
            'is_active': self.is_active,
            'id_prodi': self.id_prodi,
            'id_fakultas': self.id_fakultas,
           'nama_prodi': self.prodi.nama_prodi if self.prodi else None,
        }
    
