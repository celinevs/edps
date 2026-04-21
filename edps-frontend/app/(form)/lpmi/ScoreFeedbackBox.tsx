"use client";

import React from "react";
import {
  Box,
  Typography,
  TextField,
  Paper,
} from "@mui/material";
import { IndikatorJawaban } from "@/model/Pertanyaan";
import ToggleButton, { toggleButtonClasses } from '@mui/material/ToggleButton';
import ToggleButtonGroup, {toggleButtonGroupClasses} from '@mui/material/ToggleButtonGroup';
import {styled} from "@mui/material";

interface ScoreFeedbackBoxProps {
  questionId: string;
  selectedScore: number | undefined;
  onScoreChange: (questionId: string, indikatorId: number) => void;
  feedbackValue?: string;
  onFeedbackChange?: (questionId: string, notes: string) => void;
  indikatorList: IndikatorJawaban[];
  disable?: boolean;
}

const StyledToggleButtonGroup = styled(ToggleButtonGroup)(({ theme }) => ({
  gap: '1rem',
  [`& .${toggleButtonGroupClasses.firstButton}, & .${toggleButtonGroupClasses.middleButton}`]:
    {
      borderTopRightRadius: (theme.vars || theme).shape.borderRadius,
      borderBottomRightRadius: (theme.vars || theme).shape.borderRadius,
    },
  [`& .${toggleButtonGroupClasses.lastButton}, & .${toggleButtonGroupClasses.middleButton}`]:
    {
      borderTopLeftRadius: (theme.vars || theme).shape.borderRadius,
      borderBottomLeftRadius: (theme.vars || theme).shape.borderRadius,
      borderLeft: `1px solid ${(theme.vars || theme).palette.divider}`,
    },
  [`& .${toggleButtonGroupClasses.lastButton}.${toggleButtonClasses.disabled}, & .${toggleButtonGroupClasses.middleButton}.${toggleButtonClasses.disabled}`]:
    {
      borderLeft: `1px solid ${(theme.vars || theme).palette.action.disabledBackground}`,
    },
}));

const ScoreFeedbackBox: React.FC<ScoreFeedbackBoxProps> = ({
  questionId,
  selectedScore,
  onScoreChange,
  feedbackValue,
  onFeedbackChange,
  indikatorList,
  disable
}) => {
  return (
    <Paper
      sx={{
        p: 2,
        borderRadius: 2,
        backgroundColor: "#fafafa",
        height: '100%'
      }}
    >
      <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
        Skor
      </Typography>

      <StyledToggleButtonGroup
        exclusive
        value={selectedScore || ""}
        onChange={(_, value) => {
          if (value) onScoreChange(questionId, value);
        }}
        color="primary"
        sx={{ mb: 2, gap: 2 }}
        disabled={disable}
      >
        {indikatorList.map((choice) => (
          <ToggleButton
            key={choice.id_indikator}
            value={choice.skor}
            sx={{
              minWidth: 48,
              borderRadius: 1,
              "&.Mui-selected": {
                backgroundColor: "#d32f2f",
                color: "white",
                "&:hover": { backgroundColor: "#b71c1c" },
              },
            }}
          >
            {choice.skor}
          </ToggleButton>
        ))}
      </StyledToggleButtonGroup>

      <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
        Feedback <span style={{ color: "red" }}>*</span>
      </Typography>

      <TextField
        value={feedbackValue || ""}
        onChange={(e) =>
          onFeedbackChange && onFeedbackChange(questionId, e.target.value)
        }
        multiline
        minRows={4}
        fullWidth
        placeholder="Tuliskan umpan balik di sini..."
        disabled={disable}
        sx={{
          "& .MuiOutlinedInput-root": {
            borderRadius: 2,
            backgroundColor: "white",
          },
        }}
      />
    </Paper>
  );
};

export default ScoreFeedbackBox;