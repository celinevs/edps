from app import db
from app.models.Jawaban import Jawaban
from app.models.Akreditasi import Akreditasi
from app.models.QuestionList import LamEmba, LamInfokom
from app.models.Prodi import Prodi
from sqlalchemy import and_, cast, Integer
from sqlalchemy.sql import union_all
import pandas as pd
import numpy as np
import os
import joblib
from sklearn.metrics import r2_score

def fetch_data_from_db(filtered=None, id_prodi=None, year=None, current_year=None, reviewed=False):
    """Fetch raw data from database using SQLAlchemy"""

    queries = []

    # Common filters
    common_filters = [
        Jawaban.jawaban_prodi.isnot(None),
        Jawaban.jawaban_lpmi.isnot(None),
        Jawaban.jawaban_assesor.isnot(None),
    ]

    if current_year:
        # Example input: "2026/2027"
        target_year = int(str(current_year).split("/")[0])

        # Extract first 4 digits from DB column
        db_year = cast(
        db.func.substring(Akreditasi.tahun_berlaku, 1, 4),
        Integer
        )

        # Filter from past years until selected year
        common_filters.append(db_year <= target_year)

    # Add id_prodi filter if provided
    if id_prodi:
        common_filters.append(Akreditasi.id_prodi == id_prodi)
    
    if year:
        common_filters.append(Akreditasi.tahun_berlaku == year)
    
    if reviewed:
        common_filters.append(Akreditasi.status == 'Reviewed')

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
                *common_filters,
                LamInfokom.bobot.isnot(None),
                Akreditasi.status == 'Reviewed'
            )
        )

        queries.append(laminfokom_query)

    # LAM EMBA QUERY
    if filtered != 'infokom':
        lamemba_query = (
            db.session.query(
                Akreditasi.tahun_berlaku.label("year"),
                Prodi.kode_prodi.label("major"),
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
                *common_filters,
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

def generate_indicator_table(raw_df):

    if raw_df.empty:
        return pd.DataFrame()

    df = raw_df.copy()

    df["melampaui"] = 0
    df["memenuhi"] = 0
    df["belum_memenuhi"] = 0

    infokom_mask = df["exam"] == "laminfokom"

    df.loc[
        infokom_mask & (df["jawaban_assessor"] == 4),
        "melampaui"
    ] = 1

    df.loc[
        infokom_mask & (df["jawaban_assessor"] == 3),
        "memenuhi"
    ] = 1

    df.loc[
        infokom_mask & (df["jawaban_assessor"] < 3),
        "belum_memenuhi"
    ] = 1

    emba_mask = df["exam"] == "lamemba"

    df.loc[
        emba_mask & (df["jawaban_assessor"] == 1),
        "melampaui"
    ] = 1

    df.loc[
        emba_mask & (df["jawaban_assessor"] == 0),
        "memenuhi"
    ] = 1

    table_df = (
        df
        .groupby(["major", "exam"])
        .agg({
            "melampaui": "sum",
            "memenuhi": "sum",
            "belum_memenuhi": "sum"
        })
        .reset_index()
    )

    # Total indikator
    table_df["jumlah"] = (
        table_df["melampaui"] +
        table_df["memenuhi"] +
        table_df["belum_memenuhi"]
    )

    # Avoid division by zero
    table_df["jumlah"] = table_df["jumlah"].replace(0, 1)

    # Percentages
    table_df["indikator_u"] = (
        table_df["melampaui"] /
        table_df["jumlah"] * 100
    ).round(0).astype(int)

    table_df["indikator_m"] = (
        table_df["memenuhi"] /
        table_df["jumlah"] * 100
    ).round(0).astype(int)

    table_df["indikator_bm"] = (
        table_df["belum_memenuhi"] /
        table_df["jumlah"] * 100
    ).round(0).astype(int)

    # Rename exam labels
    table_df["LAM"] = table_df["exam"].replace({
        "laminfokom": "Infokom",
        "lamemba": "Emba"
    })

    # Final columns
    table_df = table_df[[
        "major",
        "indikator_u",
        "indikator_m",
        "indikator_bm",
        "melampaui",
        "memenuhi",
        "belum_memenuhi",
        "jumlah",
        "LAM"
    ]]

    return table_df

def compute_and_combine_risk_metrics(df, year=None):
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

    if year is not None:
        df = df[df["year"].astype(str) == str(year)]

    df["trend_penalty"] = (
        df["assessor_growth"]
        .fillna(0)
        .apply(lambda g: max(0, -g * 2))
    )

    df["risk_score"] = (
        (1 - df["score_assessor_w"]) * 0.45 +
        df["gap_lpmi_assessor"] * 0.20 +
        (1 - df["agree_lpmi_assessor"]) * 0.15 +
        # df["assessor_override_rate"] * 0.10 +
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

# def predict_future_scores(
#     df,
#     year=None,
#     major=None,
#     model_dir="ml",
#     ):
 
#     base_dir   = os.path.dirname(os.path.abspath(__file__))
#     model_path = os.path.join(base_dir, "..", model_dir)
 
#     le_exam    = joblib.load(os.path.join(model_path, "le_exam.pkl"))
#     le_major   = joblib.load(os.path.join(model_path, "le_major.pkl"))
#     scaler     = joblib.load(os.path.join(model_path, "scaler_pred.pkl"))
#     best_model = joblib.load(os.path.join(model_path, "Random_Forest.pkl"))
 
#     year_bounds_path = os.path.join(model_path, "year_bounds.pkl")
#     if os.path.exists(year_bounds_path):
#         train_min_year, train_max_year = joblib.load(year_bounds_path)
#     else:
#         import warnings
#         warnings.warn(
#             "year_bounds.pkl not found. Inferring year range from df — "
#             "year_norm may not match training distribution.",
#             UserWarning,
#         )
#         train_min_year = None
#         train_max_year = None
 
#     PRED_FEATURES = [
#         "score_prodi_w",
#         "score_lpmi_w",
#         "gap_lpmi_assessor",
#         "agree_lpmi_assessor",
#         "assessor_prev",
#         "assessor_growth",
#         "assessor_ma3",
#         "lpmi_override_rate",
#         "assessor_override_rate",
#         "year_norm",
#         "exam_enc",
#         "major_enc",
#     ]
 
#     features = aggregate_per_exam(df)         
 
#     if features.empty:
#         return pd.DataFrame()

#     features["exam"]  = features["exam"].astype(str)
#     features["major"] = features["major"].astype(str)
 
#     if major:
#         features = features[
#             features["major"].str.lower() == major.lower()
#         ]
 
#     if features.empty:
#         return pd.DataFrame()
 
#     features["year_numeric"] = (
#         features["year"]
#         .astype(str)
#         .str.extract(r"(\d{4})")[0]
#         .astype(int)
#     )
 
#     features = features.sort_values(["major", "exam", "year_numeric"])
#     if year:
#         features["future_year"] = int(year)
#     else:
#         features["future_year"] = features["year_numeric"] + 1

#     if train_min_year is None:
#         train_min_year = features["year_numeric"].min()
#         train_max_year = max(
#             features["year_numeric"].max(),
#             features["future_year"].max(),
#         )
 
#     features["year_norm"] = (
#         (features["future_year"] - train_min_year)
#         / (train_max_year - train_min_year + 1e-9)
#     )

#     def safe_label_encode(le, series):
#         """
#         Encode a series using a fitted LabelEncoder.
#         Unseen labels are mapped to len(le.classes_) (one-past-end),
#         which is a consistent sentinel the model can treat as OOV.
#         We do NOT mutate le.classes_.
#         """
#         known = set(le.classes_)
#         mapped = series.map(
#             lambda v: le.transform([v])[0] if v in known else len(le.classes_)
#         )
#         unseen = series[~series.isin(known)].unique()
#         if len(unseen):
#             import warnings
#             warnings.warn(
#                 f"LabelEncoder for '{series.name}' encountered unseen labels: "
#                 f"{unseen.tolist()}. Mapped to sentinel {len(le.classes_)}.",
#                 UserWarning,
#             )
#         return mapped
 
#     features["exam_enc"]  = safe_label_encode(le_exam,  features["exam"])
#     features["major_enc"] = safe_label_encode(le_major, features["major"])
 
#     lag_features = [
#         "assessor_prev",
#         "assessor_growth",
#         "assessor_ma3",
#     ]
 
#     missing_lag_mask = features[lag_features].isna().any(axis=1)
#     if missing_lag_mask.any():
#         import warnings
#         warnings.warn(
#             f"{missing_lag_mask.sum()} row(s) are missing lag features "
#             f"({lag_features}). These rows will use column medians as "
#             "imputed values, which may reduce prediction accuracy.",
#             UserWarning,
#         )

#         for col in lag_features:
#             median_val = features[col].median()
#             features[col] = features[col].fillna(
#                 median_val if not np.isnan(median_val) else 0.0
#             )

#     X_pred = features[PRED_FEATURES].fillna(0)

#     X_scaled = scaler.transform(X_pred)
 
#     features["predicted_score"] = best_model.predict(X_scaled).clip(0, 1)
 
#     base_cols = ["future_year", "major", "exam", "predicted_score"]
#     optional_cols = ["total_bobot"]
#     return_cols = base_cols + [
#         c for c in optional_cols if c in features.columns
#     ]
 
#     return features[return_cols].reset_index(drop=True)

def predict_future_scores(
    feat: pd.DataFrame,
    models_dir: str = "ml",
    model_name: str | None = 'Random_Forest',   # None → auto-pick best saved model
) -> pd.DataFrame:
    """
    End-to-end prediction pipeline in one function.

    Steps (explained in detail below):
        1. Load raw data from DB
        2. Prepare & normalise features
        3. Aggregate to per-exam level
        4. Engineer the same extra columns used during training
        5. Load the scaler + chosen model from disk
        6. Run prediction for the *next* year
        7. Return a tidy DataFrame

    Parameters
    ----------
    models_dir  : folder that contains the .pkl files saved during training
    model_name  : exact model file stem, e.g. "Random_Forest"
                  If None, the function tries every saved model and picks
                  the first one it can load successfully.
    filtered    : pass "emba" or "infokom" to restrict exam type (same as
                  the training helper)
    id_prodi    : optional prodi filter forwarded to fetch_data_from_db
    year        : optional year filter forwarded to fetch_data_from_db

    Returns
    -------
    DataFrame with columns:
        future_year, major, exam, predicted_score[, total_bobot]
    """

    # ── STEP 4: Recreate the extra encoded columns used during training ───────
    # The training notebook added year_norm, exam_enc, major_enc.
    # We must reproduce exactly the same transformations here so the feature
    # matrix matches what the model was trained on.

    feat["year"] = (
        feat["year"]
        .astype(str)
        .str.extract(r"(\d{4})")[0]
        .astype(int)
    )
    latest_year = feat["year"].max()
    feat["year_norm"] = (latest_year - feat["year"].min()) / (feat["year"].max() - feat["year"].min() + 1e-9)


    # Simple label encoding — must match training order.
    # If you saved LabelEncoders during training, load those instead.
    exam_cats  = sorted(feat["exam"].unique())
    major_cats = sorted(feat["major"].unique())
    feat["exam_enc"]  = feat["exam"].map({v: i for i, v in enumerate(exam_cats)})
    feat["major_enc"] = feat["major"].map({v: i for i, v in enumerate(major_cats)})

    # ── STEP 5: Build the feature matrix ─────────────────────────────────────
    # Same column order as PRED_FEATURES in the training notebook.
    PRED_FEATURES = [
        "score_prodi_w", "score_lpmi_w",
        "gap_lpmi_assessor", "agree_lpmi_assessor",
        "assessor_prev", "assessor_growth", "assessor_ma3",
        "lpmi_override_rate", "assessor_override_rate",
        "year_norm", "exam_enc", "major_enc",
    ]

    # ── DIAGNOSTIC: show which columns have NaN and why ──────────────────────
    # assessor_prev / assessor_growth are NaN for a group's FIRST year because
    # aggregate_per_exam uses .shift(1).  If every group has only one year of
    # data, ALL rows will be NaN here and the dropna below will empty the frame.
    nan_counts = feat[PRED_FEATURES].isna().sum()
    if nan_counts.any():
        print("\n[DEBUG] NaN counts per feature BEFORE imputation:")
        print(nan_counts[nan_counts > 0].to_string())
        print(f"  Total rows before imputation : {len(feat)}")

    # ── FIX: impute lag/growth columns for groups that have only one year ─────
    #
    # assessor_prev  → use the current score as the "previous" (best guess
    #                  when no real history exists)
    # assessor_growth → 0  (no change observed yet)
    # assessor_ma3   → already has min_periods=1 so should never be NaN;
    #                  fill anyway as a safety net
    #
    # This mirrors what the model saw during training for its earliest rows
    # (the training set also had some first-year NaNs that were dropped, but
    # for PREDICTION we want to keep every current row and make a best effort).
    if feat["assessor_prev"].isna().any():
        feat["assessor_prev"]   = feat["assessor_prev"].fillna(feat["score_assessor_w"])
    if feat["assessor_growth"].isna().any():
        feat["assessor_growth"] = feat["assessor_growth"].fillna(0.0)
    if feat["assessor_ma3"].isna().any():
        feat["assessor_ma3"]    = feat["assessor_ma3"].fillna(feat["score_assessor_w"])
    if feat["prodi_prev"].isna().any():
        feat["prodi_prev"]      = feat["prodi_prev"].fillna(feat["score_prodi_w"])
    if feat["prodi_growth"].isna().any():
        feat["prodi_growth"]    = feat["prodi_growth"].fillna(0.0)

    # After imputation, drop any rows still missing (would be non-lag columns)
    features = feat.dropna(subset=PRED_FEATURES).copy()

    if features.empty:
        # Detailed diagnosis so the caller knows exactly what's missing
        still_nan = feat[PRED_FEATURES].isna().sum()
        still_nan = still_nan[still_nan > 0]
        raise ValueError(
            "After NaN imputation no rows remain. "
            "The following features are still fully NaN:\n"
            f"{still_nan.to_string()}\n\n"
            "Likely causes:\n"
            "  • score_prodi_w / score_lpmi_w / gap_lpmi_assessor are NaN\n"
            "    → the aggregate step produced no valid scores (check bobot or jawaban data)\n"
            "  • exam_enc / major_enc are NaN\n"
            "    → a major or exam value present at predict-time was unseen during encoding\n"
        )

    print(f"\n[DEBUG] Rows available for prediction after imputation: {len(features)}")
    print(features[["year", "major", "exam"]].to_string(index=False))

    X = features[PRED_FEATURES].values

    # ── STEP 6: Load scaler + model, run prediction ───────────────────────────
    base_dir   = os.path.dirname(os.path.abspath(__file__))
    models_path = os.path.join(base_dir, "..", models_dir)
    scaler_path = os.path.join(models_path, "scaler_pred.pkl")
    if not os.path.exists(scaler_path):
        raise FileNotFoundError(f"Scaler not found at {scaler_path}")
    scaler = joblib.load(scaler_path)

    # Resolve model file
    if model_name:
        model_path = os.path.join(models_path, f"{model_name}.pkl")
    # else:
    #     # Auto-pick: walk the directory and try each .pkl that isn't the scaler
    #     model_path = _find_best_model(models_dir)

    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model file not found: {model_path}")

    model = joblib.load(model_path)
    loaded_model_name = os.path.splitext(os.path.basename(model_path))[0]
    print(f"  -> Using model : {loaded_model_name}")
    print(f"  -> Predicting  : {len(features)} major-exam rows")

    # Some models (e.g. Ridge) were trained on scaled data; others were not.
    # The safest approach: always scale. If the original model was trained
    # without scaling, replace the line below with just `X`.
    # (Better: save a flag alongside each model during training.)
    # X_scaled = scaler.transform(X)

    predicted = model.predict(X)

    # importances = pd.Series(
    # model.feature_importances_,  # won't work for Ridge, only tree models
    # index=PRED_FEATURES
    # ).sort_values(ascending=False)

    # ── STEP 7: Build the output DataFrame ───────────────────────────────────
    # "future_year" = the year we are predicting FOR (current year + 1).
    features = features.copy()
    features["predicted_score"] = predicted
    features["future_year"]     = latest_year + 1

    base_cols     = ["future_year", "major", "exam", "predicted_score"]
    optional_cols = ["total_bobot"]
    return_cols   = base_cols + [c for c in optional_cols if c in features.columns]

    return features[return_cols].reset_index(drop=True)

def get_actual_vs_predicted(
    models_dir: str = "ml",
    model_name: str = "Random_Forest",
    filtered: str | None = None,
    id_prodi: str | None = None,
    year: int | None = None,
) -> pd.DataFrame:
    """
    Load EXISTING trained model and return:

        actual vs predicted for ALL data

    WITHOUT retraining.
    """

    # ─────────────────────────────────────────────
    # STEP 1 — LOAD DATA
    # ─────────────────────────────────────────────
    raw_df = fetch_data_from_db(
        filtered=filtered,
        id_prodi=id_prodi,
        year=year,
    )

    if raw_df.empty:
        raise ValueError("No data found.")

    feat_q = prepare_features(raw_df)
    feat = aggregate_per_exam(feat_q)

    # ─────────────────────────────────────────────
    # STEP 2 — FEATURE ENGINEERING
    # MUST MATCH TRAINING
    # ─────────────────────────────────────────────
    feat["year"] = (
        feat["year"]
        .astype(str)
        .str.extract(r"(\d{4})")[0]
        .astype(int)
    )

    feat["year_norm"] = (
        feat["year"] - feat["year"].min()
    ) / (
        feat["year"].max() - feat["year"].min() + 1e-9
    )

    exam_cats = sorted(feat["exam"].unique())
    major_cats = sorted(feat["major"].unique())

    feat["exam_enc"] = feat["exam"].map(
        {v: i for i, v in enumerate(exam_cats)}
    )

    feat["major_enc"] = feat["major"].map(
        {v: i for i, v in enumerate(major_cats)}
    )

    # ─────────────────────────────────────────────
    # TARGET
    # Predict next year assessor score
    # ─────────────────────────────────────────────
    feat["target"] = (
        feat.groupby(["major", "exam"])["score_assessor_w"]
        .shift(-1)
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
        "major_enc",
    ]

    # ─────────────────────────────────────────────
    # HANDLE NaNs
    # ─────────────────────────────────────────────
    feat["assessor_prev"] = feat["assessor_prev"].fillna(
        feat["score_assessor_w"]
    )

    feat["assessor_growth"] = feat["assessor_growth"].fillna(0)

    feat["assessor_ma3"] = feat["assessor_ma3"].fillna(
        feat["score_assessor_w"]
    )

    model_df = feat.dropna(
        subset=PRED_FEATURES + ["target"]
    ).reset_index(drop=True)

    if model_df.empty:
        raise ValueError("No usable rows after preprocessing.")

    # ─────────────────────────────────────────────
    # USE ALL DATA (NO SPLIT FOR PREDICTION)
    # ─────────────────────────────────────────────
    X_all = model_df[PRED_FEATURES].values
    y_all = model_df["target"].values
    meta_all = model_df.reset_index(drop=True)

    # ─────────────────────────────────────────────
    # LOAD EXISTING MODEL
    # ─────────────────────────────────────────────
    base_dir = os.path.dirname(os.path.abspath(__file__))

    models_path = os.path.join(
        base_dir,
        "..",
        models_dir
    )

    scaler = joblib.load(
        os.path.join(models_path, "scaler_pred.pkl")
    )

    model_path = os.path.join(
        models_path,
        f"{model_name}.pkl"
    )

    if not os.path.exists(model_path):
        raise FileNotFoundError(
            f"Model not found: {model_path}"
        )

    model = joblib.load(model_path)

    # ─────────────────────────────────────────────
    # SCALE ONLY CERTAIN MODELS
    # ─────────────────────────────────────────────
    scale_models = [
        "Linear_Regression",
        "Ridge_Regression",
    ]

    if model_name in scale_models:
        X_all_final = scaler.transform(X_all)
    else:
        X_all_final = X_all

    # ─────────────────────────────────────────────
    # PREDICT FOR ALL DATA
    # ─────────────────────────────────────────────
    preds_all = model.predict(X_all_final)

    # Calculate R² on all data (with warning that this is not train/test split)
    r2 = r2_score(y_all, preds_all)

    # ─────────────────────────────────────────────
    # RETURN FRONTEND-READY DF WITH ALL DATA
    # ─────────────────────────────────────────────
    result_df = pd.DataFrame({
        "index": np.arange(len(y_all)),
        "year": meta_all["year"].values,
        "major": meta_all["major"].values,
        "exam": meta_all["exam"].values,
        "actual": y_all,
        "predicted": preds_all,
    })

    result_df["residual"] = (
        result_df["actual"] -
        result_df["predicted"]
    )

    result_df["abs_error"] = (
        result_df["residual"].abs()
    )

    # Add metadata - FIXED: removed .tolist() since sorted() already returns a list
    result_df.attrs["r2"] = float(r2)
    result_df.attrs["years_available"] = sorted(result_df["year"].unique())  # ← FIXED HERE
    result_df.attrs["n_samples"] = len(result_df)

    return result_df