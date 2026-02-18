import {useEffect, useState} from "react";
import {requestJira} from "@forge/bridge";

export type IssueStatus = {
    /**
     * Name of the status category an issue is associated with.
     */
    statusCategory: string,
    /**
     * Identifying key of the status category.
     */
    statusCategoryKey: string,
}

type Response = {
    /**
     * Flag to determine if issues are loading.
     */
    loading: boolean,
    /**
     * Error messages when trying to retrieve issues.
     */
    errors: { type: 'error', message: string }[],
    /**
     * Collection of issues matching the provided JQL string.
     */
    issues: IssueStatus[],
}

/**
 * Retrieve a collection of issues matching the provided JQL string.
 */
export const useIssuesFromJql = (jql: string | undefined): Response => {
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<{ type: 'error', message: string }[]>([]);
    const [issues, setIssues] = useState<IssueStatus[]>([]);

    useEffect(() => {
        if (jql === undefined) {
            return;
        }

        setLoading(true);
        setErrors([]);

        // Retrieve issues for the provided JQL string
        const fetchIssues = async () => {
            try {
                const response = await requestJira(`/rest/api/3/search/jql?jql=${jql}&fields=status`);
                const data = await response.json();

                if (response.status >= 400) {
                    if (data.errorMessages && data.errorMessages.length > 0) {
                        setIssues([]);
                        // Format error messages to be displayed in the editor
                        setErrors(data.errorMessages.map((message: string) => ({ type: 'error', message })));
                    } else {
                        throw new Error(`Invalid response code: ${response.status}`);
                    }
                } else {
                    // Map the status category of each issue
                    const issues = data.issues.map((issue: any) => {
                        const statusCategory = issue.fields.status.statusCategory;
                        return {
                            statusCategory: statusCategory.name,
                            statusCategoryKey: statusCategory.key,
                        }
                    })
                    setIssues(issues);
                }
            } catch (e) {
                console.error("Could not fetch issues", e);
                setIssues([]);
                setErrors([{ type: 'error', message: "Could not fetch issues" }]);
            } finally {
                setLoading(false);
            }
        }

        fetchIssues();
    }, [jql, setLoading, setIssues, setErrors])

    return {
        loading,
        errors,
        issues,
    }
}
