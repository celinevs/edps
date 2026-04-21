import React from "react";
import { Controller, Control } from "react-hook-form";
import { TextField } from "@mui/material";

interface TextInputControllerProps {
  name: string;
  control: Control<any>;
  label: string;
  placeholder: string;
   rules?: object;
}

const TextInputController: React.FC<TextInputControllerProps> = ({
  name,
  control,
  label,
  rules,
  placeholder,
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
          {...props}
        />
      )}
    />
  );
};

export default TextInputController;