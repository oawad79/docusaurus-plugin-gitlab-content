import { AxiosRequestConfig } from "axios"

/**
 * The plugin's options.
 */
export interface GitLabContentPluginOptions {
    /**
     * Delete local content after everything?
     */
    performCleanup?: boolean

    /**
     * CLI only mode.
     */
    noRuntimeDownloads?: boolean

    /**
     * The base URL for the source of the content.
     */
    sourceBaseUrl: string

    /**
     * The name you want to give to the data. Used by the CLI, and *must* be path safe.
     */
    name: string

    /**
     * The base output directory (e.g. "docs" or "blog").
     */
    outDir: string

    /**
     * Specify the document paths from the sourceBaseUrl
     * in a string array or function that returns a string array.
     */
    locations: string[] | Promise<string[]> | (() => string[])

    /**
     * Additional options for Axios.
     *
     * @see https://axios-http.com/docs/req_config
     */
    requestConfig?: Partial<AxiosRequestConfig>

    /**
     * An optional function that modifies the file name and content of a downloaded file.
     *
     * @param filename The file's name.
     * @param content The file's content.
     * @returns undefined to leave the content/name as is, or an object containing the filename and the content.
     */
    modifyContent?(
        filename: string,
        content: string
    ): { filename?: string; content?: string } | undefined

    rewriteImages: boolean

    replaceTextWithAnother?: Replacement[]

    escapeTags?: boolean

    excludeGroups?: string[]
}

// noinspection SpellCheckingInspection
/**
 * Some piece of content that can be fetched.
 */
export interface Fetchable {
    location: string
}

export type Replacement = {
    replace: string
    replaceWith: string
}

// export type Map<K, V> = {
//     [P in keyof K]: V;
// };