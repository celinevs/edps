from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager

db = SQLAlchemy()

def create_app():
    app = Flask(__name__)
    CORS(app,
         supports_credentials=True,
         origins=["http://localhost:3000"] )

    app.config.from_object("app.config.Config")
    db.init_app(app)

    # from app.routes.regulasi import regulasi_bp
    from app.routes.pertanyaan import pertanyaan_bp
    # from app.routes.periode import periode_bp
    from app.routes.jawaban import jawaban_bp
    from app.routes.prodi import prodi_bp
    from app.routes.user import user_bp
    from app.routes.akreditasi import akreditasi_bp
    from app.routes.lembaga import lembaga_bp
    from app.routes.auth import auth_bp, oauth, jwt_redis_blocklist
    from app.utils.response_handler import error_response
    
    jwt = JWTManager(app)
    oauth.init_app(app)



    app.register_blueprint(auth_bp)
    # app.register_blueprint(regulasi_bp)
    app.register_blueprint(pertanyaan_bp)
    # app.register_blueprint(periode_bp)
    app.register_blueprint(jawaban_bp)
    app.register_blueprint(prodi_bp)
    app.register_blueprint(user_bp)
    app.register_blueprint(akreditasi_bp)
    app.register_blueprint(lembaga_bp)

    with app.app_context():
        db.create_all()
    
    @jwt.token_in_blocklist_loader
    def check_if_token_is_revoked(jwt_header, jwt_payload: dict):
        jti = jwt_payload["jti"]
        print("CHECK JTI:", jti)
        token_in_redis = jwt_redis_blocklist.get(jti)
        print("IN REDIS:", token_in_redis)
        return token_in_redis is not None
    
    @jwt.revoked_token_loader
    def revoked_token_callback(jwt_header, jwt_payload):
        return error_response("Token has been revoked", 401)
    
    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return error_response("Invalid token", 401)
    
    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return error_response("Missing token",401)
    
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return error_response("Token has expired", 401)

    return app