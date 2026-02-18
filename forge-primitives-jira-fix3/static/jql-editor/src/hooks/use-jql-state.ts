import {useEffect, useState} from "react";
import {view} from "@forge/bridge";

type JqlState = [string | undefined, (jql: string) => void];

/**
 * Retrieve state to initialise the JQL editor.
 */
export const useJqlState = (): JqlState => {
    const [jql, setJql] = useState<string>();

    useEffect(() => {
        view.getContext()
            .then((context: any) => {
                const projectKey = context.extension?.project?.key;
                // Use project context data to set initial JQL query
                if (projectKey) {
                    setJql(`project = "${projectKey}"`);
                } else {
                    setJql("");
                }
            })
    }, [setJql])

    return [jql, setJql];
}
