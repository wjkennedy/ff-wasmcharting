import React from "react";
import { Pie } from 'react-chartjs-2';
import {Chart, ArcElement, Tooltip, Legend} from 'chart.js';
import Spinner from '@atlaskit/spinner';
import {IssueStatus} from "../hooks/use-issues-from-jql";
import {usePieChartDataFromIssues} from "../hooks/use-pie-chart-data-from-issues";
import styles from './IssuesVisualiser.module.css';
import EmptyState from '@atlaskit/empty-state';

Chart.register(ArcElement, Tooltip, Legend);

type Props = {
    /**
     * Collection of issues to visualise.
     */
    issues: IssueStatus[],
    /**
     * Flag to determine if issues are currently loading.
     */
    loading: boolean,
};

const IssuesVisualiser = ({ issues, loading }: Props) => {
    const data = usePieChartDataFromIssues(issues);

    return (
        <div className={styles.container}>
            {loading
                ? <Spinner size={"xlarge"} />
                : (issues.length === 0
                    ? <EmptyState header={"There are no issues matching your query"} />
                    : <Pie data={data} />
                )
            }
        </div>
    )
}

export default IssuesVisualiser;
