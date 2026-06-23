
# Project Overview

The **EDPS (Evaluasi Diri Program Studi)** system is a web-based platform developed to support accreditation readiness monitoring and self-evaluation processes for study programs

Several study programs undergo accreditation under two independent accreditation bodies, **LAM Infokom** and **LAM EMBA**, each of which applies different evaluation instruments, scoring schemes, and assessment criteria. Prior to the development of EDPS, self-evaluation activities were conducted manually using spreadsheets, without automated scoring, historical tracking, or analytical support.

EDPS addresses these challenges by providing an integrated multi-user platform that combines self-evaluation management, weighted automatic scoring, and machine learning–based analytics for accreditation monitoring.

The system supports four user roles:

* **Study Program (Program Studi)**
* **LPMI**
* **UPPS**
* **Administrator**

Each role is governed through a Role-Based Access Control (RBAC) mechanism that defines access permissions and workflow responsibilities.

An ETL (Extract, Transform, Load) pipeline enables administrators to configure accreditation instruments automatically from uploaded CSV files, reducing manual configuration efforts and allowing the system to adapt to different accreditation frameworks.

The analytics dashboard provides:

* Annual score progression monitoring
* Total score summaries by accreditation criteria
* Gap heatmaps between evaluators
* Risk categorization of study programs
* Accreditation readiness indicators
* Future score prediction for upcoming accreditation periods

The system fulfills four primary research objectives:

1. Supporting multi-user operations through Role-Based Access Control (RBAC).
2. Monitoring accreditation readiness across different accreditation bodies.
3. Providing automated scoring and evaluation gap visualization.
4. Delivering analytical dashboards that present evaluation results, performance trends, accreditation risks, and cross-period comparisons.

---

## Services

| Service    | Purpose                           |
| ---------- | --------------------------------- |
| Flask      | Backend API                       |
| MySQL      | Database                          |
| Redis      | Cache and Session Storage         |
| React      | Frontend                          |
