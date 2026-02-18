import React, {useCallback} from 'react';
import { JQLEditorForgeAsync } from "@atlassianlabs/jql-editor-forge";
import styles from './MyJqlEditor.module.css';

type Props = {
    /**
     * The query to render in the editor.
     */
    jql: string,
    /**
     * Update JQL when the editor is searched.
     */
    setJql: (jql: string) => void,
    /**
     * Error messages when trying to retrieve issues.
     */
    queryErrors: { type: 'error', message: string }[],
}

const MyJqlEditor = ({ jql, setJql, queryErrors }: Props) => {
    const onSearch = useCallback((query, jast) => {
        // Only update our JQL if the query is valid
        if (jast.errors.length === 0) {
            setJql(query);
        }
    }, [setJql]);

    return (
        <div className={styles.container}>
            <JQLEditorForgeAsync locale={"en"} query={jql} onSearch={onSearch} messages={queryErrors} />
        </div>
    )
}

export default MyJqlEditor
