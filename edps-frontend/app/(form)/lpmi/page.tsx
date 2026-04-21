"use client";

import React, { useEffect, useState } from "react";
import {
  Grid,
  Typography,
  Divider,
  Button,
  Paper,
  Box,
  RadioGroup,
  Radio,
  FormControlLabel,
  Pagination
} from "@mui/material";
import { useRouter } from "next/navigation";
import {
  getPertanyaanByRegulasi,
  getJawabanUserByPeriode,
} from "@/api/api_test";
import { Pertanyaan } from "@/model/Pertanyaan";
import { ReviewRequestItem } from "@/model/Jawaban";
import ScoreFeedbackBox from "./ScoreFeedbackBox";
import SubmitReviewDialog from "./SubmitReviewDialog";

interface ReviewData {
  id_regulasi: string;
  id_periode: string;
  status: string;
}

function LPMIFormPage() {
  const router = useRouter();
  const [reviewData, setReviewData] = useState<ReviewData | null>(null);
  const [pertanyaan, setPertanyaan] = useState<Pertanyaan[]>([]);
  const [totalPage, setTotalPage] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [answersLpmi, setAnswersLpmi] = useState<{ [key: string]: number }>({});
  const [notes, setNotes] = useState<{ [key: string]: string }>({});
  const [jawaban, setJawaban] = useState<ReviewRequestItem[]>([]);
  const [openDialog, setOpenDialog] = useState<boolean>(false);

  useEffect(() => {
    const storedState = sessionStorage.getItem('reviewData');
    if (storedState) {
      const parsedState = JSON.parse(storedState);
      setReviewData(parsedState);
    }
  }, [router]);

  useEffect(() => {
    const fetchData = async () => {
      if (reviewData?.id_regulasi) {
        const res = await getPertanyaanByRegulasi(reviewData.id_regulasi);
        setPertanyaan(res?.data?.pertanyaan || []);
        setTotalPage(res?.data.jumlah_pertanyaan || 0);

        if (reviewData?.id_periode) {
          const answerRes = await getJawabanUserByPeriode(reviewData.id_periode);
          const result = answerRes?.data?.jawaban.reduce(
            (acc, curr) => {
              const qid = curr.id_pertanyaan;
              acc.answers[qid] = curr.id_indikator_lpmi;
              acc.answersLpmi[qid] = curr.skor_lpmi ?? 0;
              acc.notes[qid] = curr.note_lpmi ?? "";
              return acc;
            },
            {
              answers: {} as { [key: string]: string },
              answersLpmi: {} as { [key: string]: number },
              notes: {} as { [key: string]: string },
            }
          );

          setAnswers(result.answers);
          setAnswersLpmi(result.answersLpmi);
          setNotes(result.notes);
        }
      }
    };

    fetchData();
  }, [reviewData]);

  const handleSelect = (questionId: string, choice: number) => {
    setAnswersLpmi((prev) => ({ ...prev, [questionId]: choice }));
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setCurrentPage(value);
  };

  const handleOpenDialog = () => {
    const jawabanArray = Object.entries(answersLpmi).map(
      ([id_pertanyaan, skor_lpmi]) => ({
        id_pertanyaan,
        skor_lpmi,
        note_lpmi: notes[id_pertanyaan] || "",
      })
    );
    setJawaban(jawabanArray);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => setOpenDialog(false);

  if (!reviewData) {
    return <Typography sx={{ p: 3, color: "gray" }}>Loading data...</Typography>;
  }

  if (pertanyaan.length === 0) {
    return <Typography sx={{ p: 3, color: "gray" }}>Loading questions...</Typography>;
  }

  const q = pertanyaan[currentPage - 1];

  return (
    <Box sx={{ flexGrow: 1, p: 4 }}>
      <Grid container spacing={3}>
        <Grid size={9}>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            Question {currentPage}
          </Typography>

          <Typography variant="body1" sx={{ mb: 3 }}>
            {q.deskripsi_pertanyaan}
          </Typography>

          <Divider sx={{ mb: 2 }} />
          <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
            Penilaian
          </Typography>

          <RadioGroup
            name={`question-${q.id_pertanyaan}`}
            value={answers[q.id_pertanyaan] || ""}
          >
            {q.indikator_jawaban.map((choice) => (
              <Box key={choice.id_indikator} sx={{ mb: 1 }}>
                <FormControlLabel
                  value={choice.id_indikator}
                  control={<Radio color="primary" disabled />}
                  label={
                    <Box>
                      <Typography variant="body1" fontWeight="medium">
                        Skor {choice.skor}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ ml: 1 }}
                      >
                        {choice.deskripsi}
                      </Typography>
                    </Box>
                  }
                />
                <Divider sx={{ mt: 1 }} />
              </Box>
            ))}
          </RadioGroup>
        </Grid>

        <Grid size={3}>
          <ScoreFeedbackBox
            questionId={q.id_pertanyaan}
            indikatorList={q.indikator_jawaban}
            selectedScore={answersLpmi[q.id_pertanyaan]}
            onScoreChange={handleSelect}
            feedbackValue={notes[q.id_pertanyaan]}
            onFeedbackChange={(id, value) =>
              setNotes((prev) => ({ ...prev, [id]: value }))
            }
            disable={reviewData?.status == 'Reviewed'}
          />
        </Grid>
      </Grid>
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          mt: 4,
          gap: 2,
        }}
      >
        <Pagination
          count={totalPage}
          page={currentPage}
          onChange={handlePageChange}
          color="primary"
          shape="rounded"
          showFirstButton
          showLastButton
        />

        {currentPage == pertanyaan.length && (
          <>
            {reviewData?.status != 'Reviewed' &&
              <Button
                variant="contained"
                color="success"
                onClick={handleOpenDialog}
              >
                Save
              </Button>
            }
          </>
        )}
      </Box>

      <Typography
        variant="body2"
        sx={{ mt: 2, color: "text.secondary", textAlign: "right" }}
      >
        Reviewed: {Object.keys(answersLpmi).length} / {pertanyaan.length}
      </Typography>

      <SubmitReviewDialog
        open={openDialog}
        onClose={handleCloseDialog}
        id_periode={reviewData.id_periode}
        jawaban={jawaban}
        pertanyaan={pertanyaan}
      />
    </Box>
  );
}

export default LPMIFormPage;