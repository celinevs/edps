import React from "react";
import { Controller, Control } from "react-hook-form";
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

interface DateInputControllerProps {
    name: string;
    control: Control<any>;
    label: string;
    rules?: object;
    displayFormat?: string;
    dataFormat?: string;
    views?: Array<'year' | 'month' | 'day'>;
}

const DateInputController: React.FC<DateInputControllerProps> = ({
    name,
    control,
    label,
    rules,
    displayFormat = "DD MMMM YYYY",
    dataFormat = "YYYY-MM-DD",
    views = ['day'],
    ...props
}) => {
    return (
        <Controller
            name={name}
            control={control}
            rules={rules}
            render={({ field: { onChange, value }, fieldState }) => (
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                        label={label}
                        views={views}
                        value={value ? dayjs(value as string, dataFormat) : null}
                        onChange={(date: Dayjs | null) => {
                            if (date && date.isValid()) {
                                onChange(date.format(dataFormat));
                            } else {
                                onChange(null);
                            }
                        }}
                        format={displayFormat}
                        slotProps={{
                            textField: {
                                fullWidth: true,
                                error: !!fieldState.error,
                                helperText: fieldState.error?.message,
                            },
                        }}
                        {...props}
                    />
                </LocalizationProvider>
            )}
        />
    );
};

export default DateInputController;
