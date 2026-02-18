import {IssueStatus} from "./use-issues-from-jql";
import {useMemo} from "react";
import {ChartData} from "chart.js";

type StatusCategoryMap = {
    [statusCategory: string]: {
        color: string,
        count: number,
    };
};

/**
 * Return a colour associated with a status category key.
 */
const getColorFromKey = (key: string): string => {
    switch(key) {
        case 'new':
            return '#8C9CB8';
        case 'indeterminate':
            return '#0065FF';
        case 'done':
            return '#36B37E';
        default:
            return '#8C9CB8';
    }
}

/**
 * Map a collection of issues into a data object compatible with the Chart.js pie chart.
 */
export const usePieChartDataFromIssues = (issues: IssueStatus[]): ChartData<"pie"> => {
    return useMemo(() => {
        const dataMap: StatusCategoryMap = {};

        // Aggregate issues to count number of occurrences of each status category
        issues.forEach(({ statusCategory, statusCategoryKey }) => {
            if (!dataMap[statusCategory]) {
                dataMap[statusCategory] = {
                    color: getColorFromKey(statusCategoryKey),
                    count: 0,
                };
            }

            dataMap[statusCategory].count += 1;
        });

        const data: number[] = [];
        const backgroundColor: string[] = []
        const labels: string[] = [];

        // Map our aggregated data into separate arrays for pie chart visualisation
        Object.keys(dataMap).forEach(statusCategory => {
            data.push(dataMap[statusCategory].count);
            backgroundColor.push(dataMap[statusCategory].color);
            labels.push(statusCategory);
        });

        return {
            datasets: [{
                data,
                backgroundColor,
            }],
            labels,
        }
    }, [issues])
}
