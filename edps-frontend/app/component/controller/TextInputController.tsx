import React from "react";
import { Controller, Control } from "react-hook-form";
import { TextField, SxProps, Theme, TextFieldProps } from "@mui/material";

type TextInputControllerProps = {
  name: string;
  control: Control<any>;
  label: string;
  placeholder: string;
  rules?: object;
  type?: string;
  sx?: SxProps<Theme>;
}  & TextFieldProps;

const TextInputController: React.FC<TextInputControllerProps> = ({
  name,
  control,
  label,
  rules,
  placeholder,
  type,
  sx,
  ...props
}) => {
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState }) => (
        <TextField
          {...field}
          label={label}
          variant="outlined"
          fullWidth
          placeholder={placeholder}
          error={!!fieldState.error}
          helperText={fieldState.error?.message}
          type={type}
          sx={sx}
          {...props}
        />
      )}
    />
  );
};

export default TextInputController;