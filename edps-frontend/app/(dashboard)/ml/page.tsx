"use client";

import { LineChart } from "@mui/x-charts/LineChart";
import { useGetDashboardMLQuery } from "@/api/akreditasi";

// Define the data structure
export interface ChartDataPoint {
    index: number;
    year: number;
    major: string;
    exam: string;
    actual: number;
    predicted: number;
    residual: number;
    abs_error: number;
}

interface MLDashboardResponse {
    data: {
        graph: ChartDataPoint[];
    };
    message: string;
}

export default function MLPage() {
    const { data, isLoading, isError } = useGetDashboardMLQuery();

    // handle loading
    if (isLoading) {
        return <div>Loading...</div>;
    }

    // handle error
    if (isError || !data) {
        return <div>Failed to load chart data.</div>;
    }

    // Extract the chart data from the nested structure
    const response = data as MLDashboardResponse;
    const chartData = response?.data?.graph || [];
    
    // // Get R² from the first item's attributes (if stored)
    // // Note: The R² might need to be passed separately in your API
    // const r2Score = chartData[0]?.r2 || 0;

    if (chartData.length === 0) {
        return <div>No chart data available.</div>;
    }

    // Group data by year
    const dataByYear = chartData.reduce((acc, point) => {
        if (!acc[point.year]) {
            acc[point.year] = [];
        }
        acc[point.year].push(point);
        return acc;
    }, {} as Record<number, ChartDataPoint[]>);

    // Get unique years
    const years = Object.keys(dataByYear).map(Number).sort();

    return (
        <div className="w-full space-y-6">
            <div>
                <h2 className="text-xl font-semibold mb-2">
                    Random Forest Model Predictions
                </h2>
                <div className="text-sm text-gray-600">
                    <p>Total Predictions: {chartData.length}</p>
                    <p>Years: {years.join(", ")}</p>
                </div>
            </div>

            {/* Main chart - all data */}
            <div>
                <h3 className="text-lg font-medium mb-2">
                    Actual vs Predicted - All Data
                </h3>
                <LineChart
                    height={500}
                    width={600}
                    xAxis={[
                        {
                            scaleType: "point",
                            data: chartData.map((d) => `${d.year}`),
                            label: "Year",
                        },
                    ]}
                    series={[
                        {
                            id: "actual",
                            label: "Actual",
                            data: chartData.map((d) => d.actual),
                            showMark: true,
                            color: "#2563eb",
                        },
                        {
                            id: "predicted",
                            label: "Predicted",
                            data: chartData.map((d) => d.predicted),
                            showMark: false,
                            curve: "linear",
                            color: "#dc2626",
                        },
                    ]}
                    margin={{
                        top: 50,
                        right: 50,
                        bottom: 50,
                        left: 60,
                    }}
                    grid={{
                        vertical: true,
                        horizontal: true,
                    }}
                />
            </div>

            {/* Separate charts by year */}
            {years.map((year) => (
                <div key={year} className="mt-8">
                    <h3 className="text-lg font-medium mb-2">
                        Year {year} - Actual vs Predicted
                    </h3>
                    <LineChart
                        height={300}
                        xAxis={[
                            {
                                scaleType: "point",
                                data: dataByYear[year].map((d) => `${d.major} - ${d.exam}`),
                                label: "Major - Exam",
                                tickLabelStyle: {
                                    angle: 45,
                                    textAnchor: 'start',
                                },
                            },
                        ]}
                        series={[
                            {
                                id: `actual-${year}`,
                                label: "Actual",
                                data: dataByYear[year].map((d) => d.actual),
                                showMark: true,
                                color: "#2563eb",
                            },
                            {
                                id: `predicted-${year}`,
                                label: "Predicted",
                                data: dataByYear[year].map((d) => d.predicted),
                                showMark: false,
                                curve: "linear",
                                color: "#dc2626",
                            },
                        ]}
                        margin={{
                            top: 50,
                            right: 50,
                            bottom: 100,
                            left: 60,
                        }}
                        grid={{
                            vertical: true,
                            horizontal: true,
                        }}
                    />
                </div>
            ))}

            {/* Error analysis chart */}
            <div className="mt-8">
                <h3 className="text-lg font-medium mb-2">
                    Prediction Errors (Residuals)
                </h3>
                <LineChart
                    height={300}
                    xAxis={[
                        {
                            scaleType: "point",
                            data: chartData.map((d) => `#${d.index}`),
                            label: "Data Point Index",
                        },
                    ]}
                    series={[
                        {
                            id: "residual",
                            label: "Residual (Actual - Predicted)",
                            data: chartData.map((d) => d.residual),
                            showMark: true,
                            color: "#eab308",
                        },
                        {
                            id: "abs_error",
                            label: "Absolute Error",
                            data: chartData.map((d) => d.abs_error),
                            showMark: true,
                            color: "#ef4444",
                        },
                    ]}
                    margin={{
                        top: 50,
                        right: 50,
                        bottom: 50,
                        left: 60,
                    }}
                    grid={{
                        vertical: true,
                        horizontal: true,
                    }}
                />
            </div>
        </div>
    );
}