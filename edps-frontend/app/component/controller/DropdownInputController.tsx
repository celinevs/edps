import React from "react";
import { Controller, Control } from "react-hook-form";
import { Select, FormControl, FormHelperText, InputLabel, SxProps, Theme} from "@mui/material";

interface DropdownInputControllerProps {
  name: string;
  control: Control<any>;
  label: string;
  rules?: object;
  disabled?: boolean;
  children: React.ReactNode;
  sx?: SxProps<Theme>;
}

const DropdownInputController: React.FC<DropdownInputControllerProps> = ({
  name,
  control,
  label,
  rules,
  children,
  disabled,
  sx,
  ...props
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
            {...props}
            label={label}
            value={field.value || ""}
            disabled={disabled}
            onChange={(e) => field.onChange(e.target.value)}
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
