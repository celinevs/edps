from app import create_app, db
from app.models.QuestionSet import QuestionSet
from app.models.Akreditasi import Akreditasi

def refresh_question_set_totals():
    """
    Refresh total_max_bobot and total_questions
    for one or all QuestionSet records.
    """

    question_sets = QuestionSet.query.all()

    for qs in question_sets:
        qs.update_total_max_bobot()

        print(
            f"Updated {qs.id_qs} | "
            f"total_max_bobot={qs.total_max_bobot} | "
            f"total_questions={qs.total_questions}"
        )

    akreditasi = Akreditasi.query.all()

    for a in akreditasi:
        a.update_totals()
        a.update_progress()

    db.session.commit()

    print(f"\nSuccessfully refreshed {len(question_sets)} question sets.")


if __name__ == "__main__":
    app = create_app()

    with app.app_context():

        # Refresh all question sets
        refresh_question_set_totals()

        # OR refresh specific question set
        # refresh_question_set_totals("LEM002QS2025")