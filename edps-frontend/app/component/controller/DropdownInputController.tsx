import React from "react";
import { Controller, Control } from "react-hook-form";
import { 
  Select, FormControl, FormHelperText, InputLabel, 
  SxProps, Theme, SelectProps, IconButton, InputAdornment 
} from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";

interface DropdownInputControllerProps extends Omit<SelectProps, 'value' | 'onChange' | 'disabled' | 'label'> {
  name: string;
  control: Control<any>;
  label: string;
  rules?: object;
  disabled?: boolean;
  children: React.ReactNode;
  sx?: SxProps<Theme>;
  showClearButton?: boolean;
}

const DropdownInputController: React.FC<DropdownInputControllerProps> = ({
  name,
  control,
  label,
  rules,
  children,
  disabled,
  sx,
  showClearButton = true,
  ...selectProps
}) => {
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState }) => (
        <FormControl fullWidth error={!!fieldState.error} sx={sx}>
          <InputLabel>{label}</InputLabel>
          <Select
            {...field}
            {...selectProps}
            label={label}
            value={field.value || ""}
            disabled={disabled}
            onChange={(e) => field.onChange(e.target.value)}
            endAdornment={
              showClearButton && field.value ? (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => field.onChange("")}
                    onMouseDown={(e) => e.preventDefault()}
                    edge="end"
                    sx={{ mr: 2 }}
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null
            }
          >
            {children}
          </Select>
          {fieldState.error && (
            <FormHelperText>{fieldState.error.message}</FormHelperText>
          )}
        </FormControl>
      )}
    />
  );
};

export default DropdownInputController;