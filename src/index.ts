import type { LoadContext, Plugin } from "@docusaurus/types"
import axios from "axios"
import { existsSync, writeFileSync, mkdirSync } from "fs"

import { timeIt } from "./utils"
import {GitLabContentPluginOptions} from "./types"
import path from "path";
// import fs from "fs";
// import path from "path";

// noinspection JSUnusedGlobalSymbols
export default async function pluginGitLabContent(
    context: LoadContext,
    options: GitLabContentPluginOptions
): Promise<Plugin<void>> {
    let {
        name,
        sourceBaseUrl,
        outDir,
        // performCleanup = true,
        requestConfig = {},
        rewriteImages  = true,
        replaceTextWithAnother,
        escapeTags,
        excludeGroups
    } = options

    console.log("Site Directory : ", context.siteDir);


    if (!name) {
        throw new Error(
            "I need a name to work with! Please make sure it is path-safe."
        )
    }

    if (!outDir) {
        throw new Error(
            "No output directory specified! Please specify one in your docusaurus-plugin-gitlab-content config (e.g. to download to the 'docs' folder, set outDir to docs.)"
        )
    }

    if (!sourceBaseUrl) {
        throw new Error(
            "The sourceBaseUrl field is undefined, so I don't know where to fetch from!"
        )
    }

    async function fetchGitLabContent() {
        console.log("Entering fetchGitLabContent")

        let response = await axios.get(
                                                `${sourceBaseUrl}/api/v4/groups?top_level_only=true&all_available=true`
                                                     ,requestConfig);

        let groups : any[] = response.data;

        let promises = [];

        //groups.forEach(group => {
        for (let group of groups) {
            if (!excludeGroups || !excludeGroups?.includes(group.name)) {
                if (!existsSync(`${context.siteDir}/${outDir}/${group.path}`)) {
                    mkdirSync(`${context.siteDir}/${outDir}/${group.path}`, {recursive: true});
                }

                let currentPage = 1;
                let totalPages = 1;
                do {
                    promises.push(
                        axios.get(
                            `${sourceBaseUrl}/api/v4/groups/${group.id}/projects?per_page=100&page=${currentPage}&include_subgroups=true`,
                            requestConfig
                        ).then(response => {
                            totalPages = response.headers['x-total-pages'];
                            fetchContent(response.data);
                        }).catch(error => {
                                console.log("*********************************** Downloading Group *********************************************")
                                console.log(`Location = ${sourceBaseUrl}/api/v4/groups/${group.id}/projects?per_page=200&include_subgroups=true`)
                                console.log("Error: ", error)
                                console.log("********************************************************************************")

                            }
                        )
                    );

                    currentPage++;
                } while (currentPage < totalPages);
            }
        }

        Promise.all(promises);
    }

    let tagsToReplace = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;'
    };

    function replaceTag(tag : string) {
        // @ts-ignore
        return tagsToReplace[tag] || tag;
    }

    function safeTagsReplace(str : string) {
        return str.replace(/[<>]/g, replaceTag);
    }

    function fetchContent(projects: any) {
        let promises = [];

        for (const project of projects) {

            //skip personal repos and empty ones
            if (project.namespace.kind !== 'user' && !project.empty_repo && project.readme_url) {
                promises.push(
                    //console.log(`${sourceBaseUrl}/api/v4/projects/${project.id}/repository/files/README.md/raw`);

                    axios.get(
                        `${sourceBaseUrl}/api/v4/projects/${project.id}/repository/files/${path.basename(project.readme_url)}/raw`,
                        requestConfig
                    ).then(response => {

                        if (!existsSync(`${context.siteDir}/${outDir}/${project.path_with_namespace}`)) {
                            mkdirSync(`${context.siteDir}/${outDir}/${project.path_with_namespace}`, {recursive: true});
                        }

                        if (rewriteImages) {
                            let rewrittenData: string = rewriteImagesURLs(response.data, project);

                            if (replaceTextWithAnother) {
                                replaceTextWithAnother.forEach(value => {
                                    rewrittenData = rewrittenData.replaceAll(value.replace, value.replaceWith);
                                });
                            }

                            if (escapeTags) {
                                rewrittenData = safeTagsReplace(rewrittenData);
                            }

                            writeFileSync(`${context.siteDir}/${outDir}/${project.path_with_namespace}/${project.name.trim()}.mdx`, rewrittenData);
                        } else {
                            writeFileSync(`${context.siteDir}/${outDir}/${project.path_with_namespace}/${project.name.trim()}.mdx`, response.data);
                        }
                    }).catch(
                        reason => {
                            if (reason.status !== 403) {
                                console.log("*********************************** Downloading Project *********************************************")
                                console.log(`Location = ${sourceBaseUrl}/api/v4/projects/${project.id}/repository/files/README${path.extname(project.readme_url)}/raw`)
                                console.log("Error: ", reason)
                                console.log("********************************************************************************")
                            }
                        })
                )
            }

        }

        Promise.all(promises);
    }

    function rewriteImagesURLs(fileContent: string, project: any) : string {
        let m : RegExpExecArray | null,
            rex = /\[([^\[]+)?\]\((.*\.(jpg|png|gif|jpeg|svg|JPG|PNG|GIF|JPEG|SVG))\)/gm;

        while ( m = rex.exec( fileContent ) ) {
            let rewrittenURL = `${sourceBaseUrl}/${project.path_with_namespace}/-/raw/${project.default_branch}/${m[2]}`
            //console.log('rewrittenURL = ', rewrittenURL);
            fileContent = fileContent.replaceAll(m[2] as string, rewrittenURL);
        }

        return fileContent;
    }

    // function deleteAllFilesInDir(dirPath : string, extension : string) {
    //     try {
    //         fs.readdirSync(dirPath).forEach(file => {
    //             if (file.endsWith(extension)) {
    //                 fs.rmSync(path.join(dirPath, file));
    //             }
    //         });
    //     } catch (error) {
    //         console.log(error);
    //     }
    // }

    // async function cleanContent() {
    //     const c = await findRemoteItems()
    //
    //     for (const { location } of c) {
    //         console.log(`Now Deleting ${context.siteDir}/${outDir}/${location}`);
    //         deleteAllFilesInDir(`${context.siteDir}/${outDir}/${location}`, '.mdx');
    //     }
    // }


    // noinspection JSUnusedGlobalSymbols
    return {
        //name: `docusaurus-plugin-gitlab-content-${name}`,
        name: `docusaurus-plugin-gitlab2-content`,

        // async postBuild(): Promise<void> {
        //     if (performCleanup) {
        //         return await cleanContent()
        //     }
        // },

        extendCli(cli): void {
            cli.command(`download-remote-${name}`)
                .description(`Downloads the remote ${name} data.`)
                .action(async () => await timeIt(`fetch ${name}`, fetchGitLabContent))

            // cli.command(`clear-remote-${name}`)
            //     .description(
            //         `Removes the local copy of the remote ${name} data.`
            //     )
            //     .action(async () => await timeIt(`clear ${name}`, cleanContent))
        },
    }
}

export * from "./types"
