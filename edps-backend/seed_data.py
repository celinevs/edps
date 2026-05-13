from app import create_app, db
# from app.models import Regulasi, VersiRegulasi, Prodi, Pertanyaan, IndikatorJawaban, User
from app.models.Lembaga import Lembaga
from app.models.Prodi import Prodi, Fakultas
from app.models.QuestionSet import QuestionSet
from app.models.QuestionList import LamEmba, LamInfokom
from app.models.User import User
from datetime import datetime
import uuid

app = create_app()

def seed_data():
    db.drop_all()
    db.create_all()

    # =========================
    # USER
    # =========================
    superadmin = User(
        id_user=str(uuid.uuid4()),
        email="csetiadi22@students.calvin.ac.id",
        username="Celine Vania",
        role="SUPERADMIN",
        is_active=True
    )

    db.session.add(superadmin)
    db.session.commit()
    # =========================
    # LEMBAGA
    # =========================
    laminfokom = Lembaga(
        id_lembaga= 1,
        nama_lembaga="LAMINFOKOM",
    )

    lamemba = Lembaga(
        id_lembaga= 2,
        nama_lembaga="LAMEMBA",
    )

    db.session.add_all([lamemba, laminfokom])
    db.session.commit()

    # =========================
    # QUESTION SET
    # =========================
    qs_infokom = QuestionSet(
        id_qs=str(uuid.uuid4()),
        id_lembaga=1,  # LAMINFOKOM
        question_set=1,
        tanggal_aktif=datetime.utcnow(),
        tahun_berlaku="2024/2025",
        status_aktif=True,
        total_max_bobot=0
    )

    qs_emba = QuestionSet(
        id_qs=str(uuid.uuid4()),
        id_lembaga=2,  # LAMEMBA
        question_set=1,
        tanggal_aktif=datetime.utcnow(),
        tahun_berlaku="2024/2025",
        status_aktif=True,
        total_max_bobot=0
    )

    db.session.add_all([qs_infokom, qs_emba])
    db.session.commit()

    # =========================
    # FAKULTAS
    # =========================
    fakultas_it = Fakultas(
        id_fakultas=str(uuid.uuid4()),
        nama_fakultas="Fakultas Sains dan Teknik"
    )

    fakultas_bisnis = Fakultas(
        id_fakultas=str(uuid.uuid4()),
        nama_fakultas="Fakultas Bisnis, Manajemen, dan Humaniora"
    )

    db.session.add_all([fakultas_it, fakultas_bisnis])
    db.session.commit()

    # =========================
    # PRODI
    # =========================
    prodi_list = [
    {
        "kode": "PROD08",
        "nama": "IBDA",
        "fullname": "IT & Big Data Analytics"
    },
    {
        "kode": "PROD09",
        "nama": "CDS",
        "fullname": "Computer and Data Science"
    },
    {
        "kode": "PROD10",
        "nama": "IRES",
        "fullname": "Intelligent Robotics and Electronic Systems"
    },
    {
        "kode": "PROD13",
        "nama": "BMS",
        "fullname": "Biomedical Science"
    },
    {
        "kode": "PROD14",
        "nama": "CFP",
        "fullname": "Chemical and Food Processing"
    },
    {
        "kode": "PROD11",
        "nama": "ASD",
        "fullname": "Architecture and Sustainable Design"
    },
    {
        "kode": "PROD12",
        "nama": "SCCE",
        "fullname": "Smart Construction and Civil Engineering"
    },]
    prodi_objects = []
    for p in prodi_list:
        prodi_objects.append(
        Prodi(
            id_prodi=str(uuid.uuid4()),
            kode_prodi=p["nama"],
            nama_prodi=p["fullname"],
            id_fakultas=fakultas_it.id_fakultas,
            lembaga_ids=[1, 2], 
            status_aktif=True
        ))
    
    prodi_objects.append(Prodi(
            id_prodi=str(uuid.uuid4()),
            kode_prodi='TEST1',
            nama_prodi='Infokom Only',
            id_fakultas=fakultas_bisnis.id_fakultas,
            lembaga_ids=[1], 
            status_aktif=True
        ))
    prodi_objects.append(Prodi(
            id_prodi=str(uuid.uuid4()),
            kode_prodi='TEST2',
            nama_prodi='Emba Only',
            id_fakultas=fakultas_bisnis.id_fakultas,
            lembaga_ids=[2], 
            status_aktif=True
        ))

    db.session.add_all(prodi_objects)
    db.session.commit()

    # =========================
    # PERTANYAAN LAMINFOKOM
    # =========================
    infokom_questions = [
    {
        "q_no": 1,
        'no_kriteria': '1',
        "kode": "K1",
        "kriteria": "Visi dan Misi",
        "elemen": "Kejelasan dan kesesuaian visi misi",
        "deskripsi": "Apakah visi dan misi program studi jelas dan relevan?",
        "bobot": 4,
        "jawaban": [
            "Tidak ada visi dan misi",
            "Ada visi misi namun tidak relevan",
            "Visi misi cukup relevan",
            "Visi misi sangat jelas dan relevan"
        ]
    },
    {
        "q_no": 2,
        'no_kriteria': '2',
        "kode": "K2",
        "kriteria": "Tata Pamong",
        "elemen": "Sistem tata kelola",
        "deskripsi": "Bagaimana sistem tata pamong di program studi?",
        "bobot": 3,
        "jawaban": [
            "Tidak ada sistem",
            "Sistem kurang berjalan",
            "Sistem berjalan cukup baik",
            "Sistem berjalan sangat baik"
        ]
    },
    {
        "q_no": 3,
        'no_kriteria': '3',
        "kode": "K3",
        "kriteria": "Mahasiswa",
        "elemen": "Kualitas mahasiswa",
        "deskripsi": "Bagaimana kualitas mahasiswa yang diterima?",
        "bobot": 2,
        "jawaban": [
            "Sangat rendah",
            "Rendah",
            "Cukup",
            "Tinggi"
        ]
        }
        ]
    infokom_objects = []
    for q in infokom_questions:
        infokom_objects.append(
        LamInfokom(
            id_qinfokom=str(uuid.uuid4()),
            id_qs=qs_infokom.id_qs,
            q_no=q["q_no"],
            no_kriteria= q['no_kriteria'],
            kode_kriteria=q["kode"],
            kriteria=q["kriteria"],
            jenis = 'I',
            elemen_penilaian_lam=q["elemen"],
            deskripsi_pertanyaan=q["deskripsi"],
            bobot=q["bobot"],
            jawaban_1=q["jawaban"][0],
            jawaban_2=q["jawaban"][1],
            jawaban_3=q["jawaban"][2],
            jawaban_4=q["jawaban"][3],
            )
            )
        db.session.add_all(infokom_objects)
        db.session.commit()
    
    # =========================
    # PERTANYAAN LAMEMBA
    # =========================
    emba_questions = [
    {
        "q_no": 1,
        "no_butir": "1.a",
        "kode": "E1",
        "kriteria": "Visi, Misi, Tujuan",
        "dimensi": "Visi",
        "deskripsi": "Kejelasan, konsistensi, dan relevansi visi program studi terhadap kebutuhan industri dan masyarakat",
    },
    {
        "q_no": 2,
        "no_butir": "1.a",
        "kode": "E2",
        "kriteria": "Visi, Misi, Tujuan",
        "dimensi": "Misi",
        "deskripsi": "Kesesuaian misi dengan visi serta implementasinya dalam kegiatan tridharma",
    },
    {
        "q_no": 3,
        "no_butir": "1.a",
        "kode": "E3",
        "kriteria": "Kurikulum",
        "dimensi": "Perancangan Kurikulum",
        "deskripsi": "Kesesuaian kurikulum dengan kebutuhan industri, perkembangan ilmu pengetahuan, dan standar nasional",
    },
    {
        "q_no": 4,
        "no_butir": "1.b",
        "kode": "E4",
        "kriteria": "Kurikulum",
        "dimensi": "Implementasi Kurikulum",
        "deskripsi": "Efektivitas implementasi kurikulum dalam proses pembelajaran",
    },
    {
        "q_no": 5,
        "no_butir": "1.b",
        "kode": "E5",
        "kriteria": "Penelitian",
        "dimensi": "Produktivitas",
        "deskripsi": "Jumlah dan kualitas publikasi ilmiah dosen dan mahasiswa",
    },
    {
        "q_no": 6,
        "no_butir": "1.c",
        "kode": "E6",
        "kriteria": "Penelitian",
        "dimensi": "Relevansi",
        "deskripsi": "Kesesuaian topik penelitian dengan kebutuhan industri dan masyarakat",
    },
    {
        "q_no": 7,
        "no_butir": "1.c",
        "kode": "E7",
        "kriteria": "Sumber Daya Manusia",
        "dimensi": "Dosen",
        "deskripsi": "Kualifikasi akademik dan kompetensi dosen",
    },
    {
        "q_no": 8,
        "no_butir": "1.c",
        "kode": "E8",
        "kriteria": "Sumber Daya Manusia",
        "dimensi": "Tenaga Kependidikan",
        "deskripsi": "Ketersediaan dan kompetensi tenaga kependidikan",
    }
]
    emba_objects = []
    for q in emba_questions:
        emba_objects.append(
        LamEmba(
            id_qemba=str(uuid.uuid4()),
            id_qs=qs_emba.id_qs,
            q_no=q["q_no"],
            no_butir=q["no_butir"],
            kode_kriteria=q["kode"],
            kriteria=q["kriteria"],
            dimensi=q["dimensi"],
            deskripsi_pertanyaan=q["deskripsi"],
            bobot=1,
            mandatory=True
        )
    )
    db.session.add_all(emba_objects)
    db.session.commit()
    

    # =========================
    # UPDATE TOTAL BOBOT
    # =========================
    qs_infokom.update_total_max_bobot()
    qs_emba.update_total_max_bobot()
    db.session.commit()

    print("✅ Seed data berhasil dibuat!")


# def seed_data():
#     db.drop_all()
#     db.create_all()

#     # =========================
#     # USER
#     # =========================
#     superadmin = User(
#         id_user=str(uuid.uuid4()),
#         email="csetiadi22@students.calvin.ac.id",
#         username="Celine Vania",
#         role="SUPERADMIN",
#         is_active=True
#     )

#     db.session.add(superadmin)
#     db.session.commit()
#     # =========================
#     # REGULASI
#     # =========================
#     banpt = Regulasi(
#         id_regulasi=str(uuid.uuid4()),
#         nama_regulasi="BAN-PT",
#         deskripsi_regulasi="Standar akreditasi perguruan tinggi BAN-PT"
#     )

#     laminfokom = Regulasi(
#         id_regulasi=str(uuid.uuid4()),
#         nama_regulasi="LAM INFOKOM",
#         deskripsi_regulasi="Standar akreditasi LAM INFOKOM"
#     )

#     db.session.add_all([banpt, laminfokom])
#     db.session.commit()

#     # =========================
#     # VERSI REGULASI
#     # =========================
#     banpt_v1 = VersiRegulasi(
#         id_versi=str(uuid.uuid4()),
#         id_regulasi=banpt.id_regulasi,
#         versi_regulasi=1.0,
#         tahun_berlaku=2024
#     )

#     laminfokom_v1 = VersiRegulasi(
#         id_versi=str(uuid.uuid4()),
#         id_regulasi=laminfokom.id_regulasi,
#         versi_regulasi=1.0,
#         tahun_berlaku=2023
#     )

#     db.session.add_all([banpt_v1, laminfokom_v1])
#     db.session.commit()

#     # =========================
#     # PRODI
#     # =========================
#     prodi_list = [
#         Prodi(
#             id_prodi=str(uuid.uuid4()),
#             kode_prodi="IBDA",
#             nama_prodi="IT and Big Data Analytics",
#             fakultas="FST",
#             regulasi_ids=[banpt.id_regulasi, laminfokom.id_regulasi]
#         ),
#         Prodi(
#             id_prodi=str(uuid.uuid4()),
#             kode_prodi="DBI",
#             nama_prodi="Digital Business and Innovation",
#             fakultas="FBMH",
#             regulasi_ids=[banpt.id_regulasi]
#         ),
#         Prodi(
#             id_prodi=str(uuid.uuid4()),
#             kode_prodi="IRES",
#             nama_prodi="Intelligent Robotics and Electronic Systems",
#             fakultas="FST",
#             regulasi_ids=[laminfokom.id_regulasi]
#         )
#     ]

#     db.session.add_all(prodi_list)
#     db.session.commit()

#     # =========================
#     # PERTANYAAN
#     # =========================
#     pertanyaan_list = [
#     Pertanyaan(
#         id_pertanyaan=str(uuid.uuid4()),
#         kode_kriteria='A - Kondisi Eksternal',
#         id_versi=banpt_v1.id_versi,
#         elemen_penilaian_lam='Kondisi Eksternal',
#         deskripsi_pertanyaan='Kemampuan UPPS dalam menganalisis aspek- aspek dalam lingkungan makro dan lingkungan mikro yang relevan dan dapat mempengaruhi eksistensi dan pengembangan PS maupun UPPS.',
#         bobot=6
#     ),
#     Pertanyaan(
#         id_pertanyaan=str(uuid.uuid4()),
#         kode_kriteria='B - Profil UPPS / Analisis Internal',
#         id_versi=banpt_v1.id_versi,
#         elemen_penilaian_lam='Profil Unit Pengelola Program Studi / Analisis Internal',
#         deskripsi_pertanyaan='Kemampuan UPPS dan PS dalam menyajikan seluruh informasi secara ringkas, komprehensif, serta konsisten terhadap data dan informasi yang disampaikan pada masing masing kriteria.',
#         bobot=6
#     ),
#     Pertanyaan(
#         id_pertanyaan=str(uuid.uuid4()),
#         kode_kriteria='C.1.1.1 - VMTS [PENETAPAN] A',
#         id_versi=banpt_v1.id_versi,
#         elemen_penilaian_lam='A. Ketersediaan dokumen kebijakan, standar, IKU, dan IKT yang berkaitan dengan Visi, Misi, Tujuan, Strategi (VMTS) UPPS dan PS',
#         deskripsi_pertanyaan='A. Rumusan VMTS UPPS dan PS yang sesuai dengan VMTS PT, memayungi visi keilmuan program studi dan melibatkan pemangku kepentingan internal dan eksternal.',
#         bobot=0.5
#     ),
#     Pertanyaan(
#         id_pertanyaan=str(uuid.uuid4()),
#         kode_kriteria='C.1.1.1 - VMTS [PENETAPAN] B',
#         id_versi=banpt_v1.id_versi,
#         elemen_penilaian_lam='B. Rumusan strategi pencapaian VMTS UPPS dan PS.',
#         deskripsi_pertanyaan='B. Rumusan strategi pencapaian VMTS UPPS dan PS yang memenuhi tahapan yang jelas, dokumen yang lengkap dan terkait pencapaian visi misi.',
#         bobot=0.25
#     ),
#     Pertanyaan(
#         id_pertanyaan=str(uuid.uuid4()),
#         kode_kriteria='INFOKOM-1',
#         id_versi=laminfokom_v1.id_versi,
#         elemen_penilaian_lam='Kurikulum',
#         deskripsi_pertanyaan='Kesesuaian kurikulum dengan kebutuhan industri dan perkembangan teknologi informasi.',
#         bobot=4
#     ),
#     Pertanyaan(
#         id_pertanyaan=str(uuid.uuid4()),
#         kode_kriteria='INFOKOM-2',
#         id_versi=laminfokom_v1.id_versi,
#         elemen_penilaian_lam='Sumber Daya Manusia',
#         deskripsi_pertanyaan='Kualifikasi dan kompetensi dosen dalam mendukung pembelajaran berbasis teknologi.',
#         bobot=3
#     ),
#     Pertanyaan(
#         id_pertanyaan=str(uuid.uuid4()),
#         kode_kriteria='INFOKOM-3',
#         id_versi=laminfokom_v1.id_versi,
#         elemen_penilaian_lam='Penelitian dan Publikasi',
#         deskripsi_pertanyaan='Produktivitas penelitian dan publikasi ilmiah di bidang informatika.',
#         bobot=2
#     ),
#     Pertanyaan(
#         id_pertanyaan=str(uuid.uuid4()),
#         kode_kriteria='INFOKOM-4',
#         id_versi=laminfokom_v1.id_versi,
#         elemen_penilaian_lam='Kerja Sama Industri',
#         deskripsi_pertanyaan='Kerja sama dengan industri dalam mendukung pembelajaran, magang, dan penempatan lulusan.',
#         bobot=1
#     ),
# ]

#     db.session.add_all(pertanyaan_list)
#     db.session.commit()

#     # =========================
#     # INDIKATOR JAWABAN (4 per pertanyaan)
#     # =========================
#     indikator_list = []

#     indikator_template = [
#         (1, "Kurang", "Kriteria belum terpenuhi."),
#         (2, "Cukup", "Sebagian kriteria terpenuhi."),
#         (3, "Baik", "Sebagian besar kriteria terpenuhi."),
#         (4, "Sangat Baik", "Seluruh kriteria terpenuhi dengan sangat baik."),
#     ]

#     for p in pertanyaan_list:
#         for skor, label, desc in indikator_template:
#             indikator_list.append(
#                 IndikatorJawaban(
#                     id_indikator=str(uuid.uuid4()),
#                     id_pertanyaan=p.id_pertanyaan,
#                     skor=skor,
#                     label=label,
#                     deskripsi=desc
#                 )
#             )

#     db.session.add_all(indikator_list)
#     db.session.commit()

#     # =========================
#     # UPDATE TOTAL BOBOT
#     # =========================
#     banpt_v1.update_total_max_bobot()
#     laminfokom_v1.update_total_max_bobot()
#     db.session.commit()

#     print("✅ Seed data berhasil dibuat!")

if __name__ == "__main__":
    with app.app_context():
        seed_data()