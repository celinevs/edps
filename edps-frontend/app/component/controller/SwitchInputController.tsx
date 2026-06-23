import React from "react";
import { Controller, Control } from "react-hook-form";
import {
    FormControlLabel,
    Switch,
    SwitchProps,
    FormHelperText,
    FormControl
} from "@mui/material";

type SwitchInputControllerProps = {
    name: string;
    control: Control<any>;
    label: string;
    rules?: object;
} & SwitchProps;

const SwitchInputController: React.FC<SwitchInputControllerProps> = ({
    name,
    control,
    label,
    rules,
    ...props
}) => {
    return (
        <Controller
            name={name}
            control={control}
            rules={rules}
            render={({ field, fieldState }) => (
                <FormControl error={!!fieldState.error}>
                    <FormControlLabel
                        control={
                            <Switch
                                {...props}
                                checked={Boolean(field.value)}
                                onChange={(e) =>
                                    field.onChange(e.target.checked)
                                }
                            />
                        }
                        label={label}
                    />
                    {fieldState.error && (
                        <FormHelperText>
                            {fieldState.error.message}
                        </FormHelperText>
                    )}
                </FormControl>
            )}
        />
    );
};

export default SwitchInputController;