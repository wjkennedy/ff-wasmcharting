import React from 'react';
import {useJqlState} from "./hooks/use-jql-state";
import MyJqlEditor from "./components/MyJqlEditor";
import styles from './App.module.css';
import IssuesVisualiser from "./components/IssuesVisualiser";
import {useIssuesFromJql} from "./hooks/use-issues-from-jql";

function App() {
    const [jql, setJql] = useJqlState();
    const { loading, errors, issues } = useIssuesFromJql(jql);

    if (jql === undefined) {
        return null;
    }

    return (
        <div className={styles.app}>
            <h3 className={styles.heading}>Issue status summary</h3>
            <MyJqlEditor jql={jql} setJql={setJql} queryErrors={errors} />
            <IssuesVisualiser issues={issues} loading={loading} />
        </div>
    );
}

export default App;
