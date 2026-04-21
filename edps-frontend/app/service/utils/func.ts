import { Pertanyaan } from "@/model/Pertanyaan";

interface WeightSummaryItem {
  bobot: number;
  total: number;
  answered: number;
  points: number;
}

interface WeightSummaryMap {
  [bobot: number]: {
    total: number;
    answered: number;
    points: number;
  };
}

/**
 * Retrieves the indicator details (score, description, and ID) for a given question and indicator ID.
 **/
export const getIndicatorScore = (
  pertanyaan: Pertanyaan,
  indicatorId: number |number
): { score: number; description: string; } | null => {
  if (indicatorId === undefined || indicatorId === null || !pertanyaan) return null;
  
  const indicator = pertanyaan.indikator_jawaban.find(
    (i) => i.skor === indicatorId
  );
  
  if (!indicator) return null;
  
  return {
    score: indicator.skor,
    description: indicator.deskripsi,
  };
};

/**
 * Calculate total bobot based on selected answers
 */
export const calculateTotalBobot = (
  pertanyaan: Pertanyaan[],
  answers: { [key: number]: number},
  lembaga?: number
): number => {
  let total = 0;

  pertanyaan.forEach((q) => {
    const selectedId = answers[q.q_no];
    if (!selectedId) return;

    const indikator = q.indikator_jawaban.find(
      (i) => i.skor === selectedId
    );
    if (!indikator) return;

    const maxSkor = Math.max(
      ...q.indikator_jawaban.map((i) => i.skor)
    );

    if (lembaga == 1) {
    const nilai = (indikator.skor / maxSkor) * q.bobot;
    total += nilai;
    }
    else {
      total += indikator.skor
    }
  });

  return total;
};

/**
 * Get weight summary with points per bobot
 */
export const getWeightSummaryMap = (
  pertanyaan: Pertanyaan[],
  answers: { [key: number]: number }
): WeightSummaryMap => {
  const summary: WeightSummaryMap = {};

  pertanyaan.forEach((q) => {
    if (!summary[q.bobot]) {
      summary[q.bobot] = {
        total: 0,
        answered: 0,
        points: 0,
      };
    }

    summary[q.bobot].total += 1;

    const selectedId = answers[q.q_no];
    if (selectedId) {
      summary[q.bobot].answered += 1;

      const indikator = q.indikator_jawaban.find(
        (i) => i.skor === selectedId
      );

      if (indikator) {
        const maxSkor = Math.max(
          ...q.indikator_jawaban.map((i) => i.skor)
        );

        const nilai = (indikator.skor / maxSkor) * q.bobot;
        summary[q.bobot].points += nilai;
      }
    }
  });

  return summary;
};

/**
 * Get weight summary as sorted array
 */
export const getWeightSummaryArray = (
  pertanyaan: Pertanyaan[],
  answers: { [key: number]: number }
): WeightSummaryItem[] => {
  const summary = getWeightSummaryMap(pertanyaan, answers);
  
  return Object.entries(summary)
    .map(([bobot, val]) => ({
      bobot: Number(bobot),
      ...val,
    }))
    .sort((a, b) => b.bobot - a.bobot);
};

/**
 * Calculate bobot progress percentage
 */
export const calculateBobotProgress = (
  totalBobot: number,
  maxBobot: number | undefined,
): number => {
  if (!maxBobot || maxBobot === 0 ) return 0;
  return (totalBobot / maxBobot) * 100
};


// Turn date to this format: Tue, Mar 31, 2026
export const formatDate = (dateString: string) => {
    if (!dateString) return '';

    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };