from app import db
from app.models.Jawaban import Jawaban
from app.models.Akreditasi import Akreditasi
from app.models.QuestionList import LamEmba, LamInfokom
from app.models.Prodi import Prodi
from sqlalchemy import and_
from sqlalchemy.sql import union_all
import pandas as pd
import numpy as np
import joblib

def fetch_data_from_db(filtered=None):
    """Fetch raw data from database using SQLAlchemy"""

    queries = []

    # LAM INFOKOM QUERY
    if filtered != 'emba':
        laminfokom_query = (
            db.session.query(
                Akreditasi.tahun_berlaku.label("year"),
                Prodi.kode_prodi.label("major"),
                db.literal("laminfokom").label("exam"),
                LamInfokom.q_no.label("q_no"),
                LamInfokom.bobot.label("bobot"),
                Jawaban.jawaban_prodi.label("jawaban_prodi"),
                Jawaban.jawaban_lpmi.label("jawaban_lpmi"),
                Jawaban.jawaban_assesor.label("jawaban_assessor"),
                Jawaban.note_lpmi.label("note_lpmi"),
                Jawaban.note_assesor.label("note_assessor"),
            )
            .join(Prodi, Akreditasi.id_prodi == Prodi.id_prodi)
            .join(Jawaban, Jawaban.id_akreditasi == Akreditasi.id_akreditasi)
            .join(
                LamInfokom,
                and_(
                    LamInfokom.id_qs == Akreditasi.id_qs,
                    LamInfokom.q_no == Jawaban.q_no
                )
            )
            .filter(
                Jawaban.jawaban_prodi.isnot(None),
                Jawaban.jawaban_lpmi.isnot(None),
                Jawaban.jawaban_assesor.isnot(None),
                LamInfokom.bobot.isnot(None),
            )
        )

        queries.append(laminfokom_query)

    # LAM EMBA QUERY
    if filtered != 'infokom':
        lamemba_query = (
            db.session.query(
                Akreditasi.tahun_berlaku.label("year"),
                Prodi.nama_prodi.label("major"),
                db.literal("lamemba").label("exam"),
                LamEmba.q_no.label("q_no"),
                LamEmba.bobot.label("bobot"),
                Jawaban.jawaban_prodi.label("jawaban_prodi"),
                Jawaban.jawaban_lpmi.label("jawaban_lpmi"),
                Jawaban.jawaban_assesor.label("jawaban_assessor"),
                Jawaban.note_lpmi.label("note_lpmi"),
                Jawaban.note_assesor.label("note_assessor"),
            )
            .join(Prodi, Akreditasi.id_prodi == Prodi.id_prodi)
            .join(Jawaban, Jawaban.id_akreditasi == Akreditasi.id_akreditasi)
            .join(
                LamEmba,
                and_(
                    LamEmba.id_qs == Akreditasi.id_qs,
                    LamEmba.q_no == Jawaban.q_no
                )
            )
            .filter(
                Jawaban.jawaban_prodi.isnot(None),
                Jawaban.jawaban_lpmi.isnot(None),
                Jawaban.jawaban_assesor.isnot(None),
                LamEmba.bobot.isnot(None),
            )
        )

        queries.append(lamemba_query)

    # No query available
    if not queries:
        return pd.DataFrame()

    # UNION ALL
    combined_query = union_all(*queries)

    results = db.session.execute(combined_query)

    # Convert to DataFrame
    data = []
    for row in results:
        data.append({
            "year": row.year,
            "major": row.major,
            "exam": row.exam,
            "q_no": row.q_no,
            "bobot": row.bobot,
            "jawaban_prodi": row.jawaban_prodi,
            "jawaban_lpmi": row.jawaban_lpmi,
            "jawaban_assessor": row.jawaban_assessor,
            "note_lpmi": row.note_lpmi,
            "note_assessor": row.note_assessor,
        })

    return pd.DataFrame(data)

def normalize_column(series):
    """Normalize series to 0-1 range"""
    min_val, max_val = series.min(), series.max()
    return (series - min_val) / (max_val - min_val + 1e-9)

def prepare_features(raw_df):
    """Prepare features from raw dataframe"""
    df = raw_df.copy()

    for col in ["jawaban_prodi","jawaban_lpmi","jawaban_assessor"]:
        df[f"{col}_num"] = pd.to_numeric(df[col].replace({"Yes":1,"No":0}), errors="coerce")

    # Normalize based on exam type
    mask_info = df["exam"] == "laminfokom"
    for col in ["jawaban_prodi_num", "jawaban_lpmi_num", "jawaban_assessor_num"]:
        df.loc[mask_info, f"{col}_norm"] = (df.loc[mask_info, col] - 1) / 3
        df.loc[~mask_info, f"{col}_norm"] = df.loc[~mask_info, col]
    
    # Weighted scores
    for actor in ["prodi", "lpmi", "assessor"]:
        df[f"weighted_{actor}"] = df[f"jawaban_{actor}_num_norm"] * df["bobot"]
    
    # Agreement flags
    df["agree_pl"] = (df["jawaban_prodi_num"] == df["jawaban_lpmi_num"]).astype(int)
    df["agree_la"] = (df["jawaban_lpmi_num"] == df["jawaban_assessor_num"]).astype(int)
    df["agree_pa"] = (df["jawaban_prodi_num"] == df["jawaban_assessor_num"]).astype(int)
    
    # Override flags
    df["lpmi_flag"] = (df["note_lpmi"] != "").astype(int)
    df["assessor_flag"] = (df["note_assessor"] != "").astype(int)
    
    return df

def aggregate_per_exam(df):
    """Aggregate features per exam (major + exam + year)"""
    GRP = ["year", "major", "exam"]

    # Weighted scores
    w_agg = df.groupby(GRP).apply(lambda g: pd.Series({
        "score_prodi_w": (g["weighted_prodi"].sum() / g["bobot"].sum()),
        "score_lpmi_w": (g["weighted_lpmi"].sum() / g["bobot"].sum()),
        "score_assessor_w": (g["weighted_assessor"].sum() / g["bobot"].sum()),
        "total_bobot": g["bobot"].sum(),
    })).reset_index()
    
    # Unweighted scores
    u_agg = df.groupby(GRP).agg(
        score_prodi_uw=("jawaban_prodi_num_norm", "mean"),
        score_lpmi_uw=("jawaban_lpmi_num_norm", "mean"),
        score_assessor_uw=("jawaban_assessor_num_norm", "mean"),
        std_assessor=("jawaban_assessor_num_norm", "std"),
    ).reset_index()
    
    # Consensus metrics
    c_agg = df.groupby(GRP).agg(
        agree_prodi_lpmi=("agree_pl", "mean"),
        agree_lpmi_assessor=("agree_la", "mean"),
        agree_prodi_assessor=("agree_pa", "mean"),
        lpmi_override_rate=("lpmi_flag", "mean"),
        assessor_override_rate=("assessor_flag", "mean"),
        n_questions=("q_no", "count"),
    ).reset_index()
    
    # Merge all aggregations
    feat = w_agg.merge(u_agg, on=GRP).merge(c_agg, on=GRP)
    
    # Compute gaps
    feat["gap_prodi_lpmi"] = (feat["score_prodi_w"] - feat["score_lpmi_w"]).abs()
    feat["gap_lpmi_assessor"] = (feat["score_lpmi_w"] - feat["score_assessor_w"]).abs()
    feat["gap_prodi_assessor"] = (feat["score_prodi_w"] - feat["score_assessor_w"]).abs()
    feat["lpmi_direction"] = feat["score_lpmi_w"] - feat["score_prodi_w"]
    feat["assessor_direction"] = feat["score_assessor_w"] - feat["score_lpmi_w"]
    
    # Sort for time-based features
    feat = feat.sort_values(["major", "exam", "year"]).reset_index(drop=True)
    
    # Time-based features (lags and growth)
    feat["assessor_prev"] = feat.groupby(["major", "exam"])["score_assessor_w"].shift(1)
    feat["prodi_prev"] = feat.groupby(["major", "exam"])["score_prodi_w"].shift(1)
    feat["assessor_growth"] = feat["score_assessor_w"] - feat["assessor_prev"]
    feat["prodi_growth"] = feat["score_prodi_w"] - feat["prodi_prev"]
    feat["assessor_ma3"] = feat.groupby(["major", "exam"])["score_assessor_w"].transform(
        lambda x: x.rolling(3, min_periods=1).mean()
    )
    
    return feat

def compute_and_combine_risk_metrics(df):
    """
    Compute risk metrics and combine risk scores for majors
    with multiple exams.

    Risk formula (Method C — trend-aware):
      risk = (1 - score_assessor_w)*0.45
             + gap_lpmi_assessor*0.20
             + (1 - agree_lpmi_assessor)*0.15
             + assessor_override_rate*0.10
             + trend_penalty*0.10

    Returns:
        risk_per_exam     -> risk metrics for each exam
        risk_per_major    -> combined risk metrics per major-year
    """

    df = df.copy()

    df["trend_penalty"] = (
        df["assessor_growth"]
        .fillna(0)
        .apply(lambda g: max(0, -g * 2))
    )

    df["risk_score"] = (
        (1 - df["score_assessor_w"]) * 0.45 +
        df["gap_lpmi_assessor"] * 0.20 +
        (1 - df["agree_lpmi_assessor"]) * 0.15 +
        df["assessor_override_rate"] * 0.10 +
        df["trend_penalty"] * 0.10
    )

    # Normalize to 0–1
    # df["risk_score"] = normalize_column(df["risk_score_raw"])

    # Risk category
    df["risk_level"] = pd.cut(
        df["risk_score"],
        bins=[0, 0.33, 0.66, 1.01],
        labels=["Low", "Medium", "High"],
        include_lowest=True
    )

    # Save per-exam result
    risk_per_exam = df.copy()

    combined = []

    for (year, major), group in risk_per_exam.groupby(["year", "major"]):

        total_bobot = group["total_bobot"].sum()

        # Weighted average if multiple exams
        if len(group) == 1:
            risk_combined = group["risk_score"].iloc[0]
        else:
            risk_combined = (
                (group["risk_score"] * group["total_bobot"]).sum()
                / total_bobot
            )

        combined.append({
            "year": year,
            "major": major,
            "risk_score_combined": risk_combined,
            "risk_level_combined": pd.cut(
                [risk_combined],
                bins=[0, 0.33, 0.66, 1.01],
                labels=["Low", "Medium", "High"],
                include_lowest=True
            )[0],
            "total_bobot": total_bobot,
            "n_exams": len(group)
        })

    risk_per_major = pd.DataFrame(combined)

    return risk_per_exam, risk_per_major

# Constants for priority calculation
ALPHA = 0.4  # weight for validation gap (disagreement)
BETA = 0.6   # weight for absolute weakness (performance)

def compute_priority_table(df):
    """Compute priority scores for each question"""
    priority_rows = []
    
    for (year, major, exam), group in df.groupby(["year", "major", "exam"]):
        for _, row in group.iterrows():
            l_norm = row.get("jawaban_lpmi_num_norm")
            a_norm = row.get("jawaban_assessor_num_norm")
            
            if pd.isna(l_norm) or pd.isna(a_norm):
                continue
            
            bobot = row["bobot"]
            gap_lpmi_assessor = abs(a_norm - l_norm)
            weakness = 1.0 - a_norm
            combined = ALPHA * gap_lpmi_assessor + BETA * weakness
            priority_score = bobot * combined
            
            # Determine priority level
            if bobot >= 1.2 and combined >= 0.70:
                level = "Critical"
            elif (bobot >= 1.2 and weakness >= 0.60) or (gap_lpmi_assessor >= 0.40 and bobot >= 1.0):
                level = "High"
            elif combined >= 0.35:
                level = "Medium"
            else:
                level = "Low"
            
            priority_rows.append({
                "year": year, "major": major, "exam": exam,
                "q_no": row["q_no"], "bobot": bobot,
                "lpmi_score": round(l_norm, 4),
                "assessor_score": round(a_norm, 4),
                "gap": round(gap_lpmi_assessor, 4),
                "weakness": round(weakness, 4),
                "priority_score": round(priority_score, 4),
                "priority_level": level
            })
    
    prio_df = pd.DataFrame(priority_rows)
    
    prio_df["rank"] = prio_df.groupby(["year", "major", "exam"])["priority_score"]\
                             .rank(ascending=False, method="dense").astype(int)
    
    return prio_df

def predict_future_scores(
    df,
    year=None,
    major=None,
    model_dir="ml"
):
    """Predict future assessor score"""

    import os

    base_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(base_dir, "..", model_dir)

    # Load assets
    le_exam = joblib.load(
        os.path.join(model_path, "le_exam.pkl")
    )

    le_major = joblib.load(
        os.path.join(model_path, "le_major.pkl")
    )

    scaler = joblib.load(
        os.path.join(model_path, "scaler_pred.pkl")
    )

    best_model = joblib.load(
        os.path.join(model_path, "Random_Forest.pkl")
    )

    PRED_FEATURES = [
        "score_prodi_w",
        "score_lpmi_w",
        "gap_lpmi_assessor",
        "agree_lpmi_assessor",
        "assessor_prev",
        "assessor_growth",
        "assessor_ma3",
        "lpmi_override_rate",
        "assessor_override_rate",
        "year_norm",
        "exam_enc",
        "major_enc"
    ]

    # Aggregate
    features = aggregate_per_exam(df)

    if features.empty:
        return pd.DataFrame()

    # Ensure string
    features["exam"] = features["exam"].astype(str)
    features["major"] = features["major"].astype(str)

    if major:
        features = features[
            features["major"].str.lower() == major.lower()
        ]

    if features.empty:
        return pd.DataFrame()

    # Extract numeric year
    features["year_numeric"] = (
        features["year"]
        .astype(str)
        .str.extract(r"(\d{4})")[0]
        .astype(int)
    )

    # Latest row
    latest_features = (
        features
        .sort_values("year_numeric")
        .groupby(["major", "exam"])
        .tail(1)
        .copy()
    )

    # Future year
    if year:
        latest_features["future_year"] = year
    else:
        latest_features["future_year"] = (
            latest_features["year_numeric"] + 1
        )

    # Normalize future year
    min_year = features["year_numeric"].min()

    max_year = max(
        features["year_numeric"].max(),
        latest_features["future_year"].max()
    )

    latest_features["year_norm"] = (
        (latest_features["future_year"] - min_year) /
        (max_year - min_year + 1e-9)
    )

    # Handle unseen labels
    unseen_exams = (
        set(latest_features["exam"]) -
        set(le_exam.classes_)
    )

    if unseen_exams:
        le_exam.classes_ = np.concatenate([
            le_exam.classes_,
            list(unseen_exams)
        ])

    unseen_majors = (
        set(latest_features["major"]) -
        set(le_major.classes_)
    )

    if unseen_majors:
        le_major.classes_ = np.concatenate([
            le_major.classes_,
            list(unseen_majors)
        ])

    # Encode
    latest_features["exam_enc"] = le_exam.transform(
        latest_features["exam"]
    )

    latest_features["major_enc"] = le_major.transform(
        latest_features["major"]
    )

    # Prepare input
    X_pred = latest_features[PRED_FEATURES].fillna(0)

    # Scale
    X_scaled = scaler.transform(X_pred)

    # Predict
    latest_features["predicted_score"] = (
        best_model.predict(X_scaled)
    )

    latest_features["predicted_score"] = (
        latest_features["predicted_score"]
        .clip(0, 1)
    )

    return latest_features[
        [
            "future_year",
            "major",
            "exam",
            "predicted_score",
            "total_bobot"
        ]
    ]