import { useMemo } from "react";
import { Pertanyaan } from "@/model/Pertanyaan";
import { calculateBobotProgress, calculateTotalBobot, getWeightSummaryArray } from "../utils/func";

interface UseWeightCalculationsProps {
  pertanyaan: Pertanyaan[];
  answers: { [key: number]: number };
  maxBobot?: number;
  lembaga?: number;
}

export const useWeightCalculations = ({
  pertanyaan,
  answers,
  maxBobot,
  lembaga,
}: UseWeightCalculationsProps) => {
  const totalBobot = useMemo(() => {
    return calculateTotalBobot(pertanyaan, answers, lembaga);
  }, [pertanyaan, answers, lembaga]);

  const bobotProgress = useMemo(() => {
    return calculateBobotProgress(totalBobot, maxBobot);
  }, [totalBobot, maxBobot]);

  const weightSummary = useMemo(() => {
    return getWeightSummaryArray(pertanyaan, answers);
  }, [pertanyaan, answers]);

  const totalQuestions = useMemo(() => {
    return pertanyaan.length;
  }, [pertanyaan]);

  const answeredQuestions = useMemo(() => {
    return Object.keys(answers).length;
  }, [answers]);

  const answerProgress = useMemo(() => {
    return totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;
  }, [answeredQuestions, totalQuestions]);

  return {
    totalBobot,
    bobotProgress,
    weightSummary,
    totalQuestions,
    answeredQuestions,
    answerProgress,
  };
};