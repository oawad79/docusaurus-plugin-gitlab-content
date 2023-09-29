import type { LoadContext, Plugin } from "@docusaurus/types"
import axios from "axios"
import { existsSync, writeFileSync, mkdirSync } from "fs"

import { timeIt } from "./utils"
import {Fetchable, GitLabContentPluginOptions} from "./types"
import fs from "fs";
import path from "path";

// noinspection JSUnusedGlobalSymbols
export default async function pluginGitLabContent(
    context: LoadContext,
    options: GitLabContentPluginOptions
): Promise<Plugin<void>> {
    let {
        name,
        sourceBaseUrl,
        outDir,
        locations,
        performCleanup = true,
        requestConfig = {},
        rewriteImages  = true,
        replaceTextWithAnother
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

    if (!locations) {
        throw new Error(
            "The documents field is undefined, so I don't know what to fetch! It should be a string array, function that returns a string array, or promise that resolves with a string array."
        )
    }

    if (!sourceBaseUrl) {
        throw new Error(
            "The sourceBaseUrl field is undefined, so I don't know where to fetch from!"
        )
    }

    async function findRemoteItems(): Promise<Fetchable[]> {
        console.log("Entering findRemoteItems")
        const a: Fetchable[] = []

        const resolvedLocations =
            typeof locations === "function"
                ? locations()
                : ((await locations) as string[])

        for (const location of resolvedLocations) {
            console.log('Deleting location = ', location);
            a.push({ location })
        }

        return a
    }

    async function fetchGitLabContent() {
        console.log("Entering fetchGitLabContent")

        const c = await findRemoteItems();

        let promises = [];

        for (let { location } of c) {
            //console.log("Looping ", location)
            //console.log(`${sourceBaseUrl}/api/v4/search?scope=projects&search=${location}`);

            promises.push(
                axios.get(
                    //`${sourceBaseUrl}/api/v4/search?scope=projects&search=${location}`,
                    `${sourceBaseUrl}/api/v4/groups/${location}/projects`,
                    requestConfig
                ).then(response => {
                    if (!existsSync(location)) {
                        //console.log(`mkDirSync = ${context.siteDir}/${outDir}/${location}`)
                        mkdirSync(`${context.siteDir}/${outDir}/${location}`, { recursive: true })
                    }

                    fetchContent(response.data, location);
                })
            );
        }

        Promise.all(promises);
    }


    function fetchContent(projects: any, location: string) {
        console.log("Entering fetchContent")

        for (const project of projects) {
            console.log("Looping projects ", project)
            if (project.path_with_namespace.startsWith(location)) {
                //console.log(`URL to download = ${sourceBaseUrl}/api/v4/projects/${project.id}/repository/files/README.md/raw`);
                axios.get(
                    `${sourceBaseUrl}/api/v4/projects/${project.id}/repository/files/README.md/raw`,
                    requestConfig
                ).then(response => {
                    //console.log(`Writing to = ${context.siteDir}/${outDir}/${location}/${project.name}.md`);
                    //console.log("Received file = ", response.data);
                    if (rewriteImages) {
                        let rewrittenData: string = rewriteImagesURLs(response.data, project);

                        if (replaceTextWithAnother) {
                            rewrittenData = rewrittenData.replaceAll(replaceTextWithAnother.replace, replaceTextWithAnother.replaceWith);
                        }

                        writeFileSync(`${context.siteDir}/${outDir}/${location}/${project.name}.md`, rewrittenData);
                    }
                    else {
                        writeFileSync(`${context.siteDir}/${outDir}/${location}/${project.name}.md`, response.data);
                    }
                }).catch(
                    reason => {
                        console.log("Error: ", reason)
                    }
                )
            }
        }
    }

    function rewriteImagesURLs(fileContent: string, project: any) : string {
        let m : RegExpExecArray | null,
            rex = /\[([^\[]+)\]\((.*\.(jpg|png|gif|jpeg|JPG|PNG|GIF|JPEG))\)/gm;

        while ( m = rex.exec( fileContent ) ) {
            let rewrittenURL = `${sourceBaseUrl}/${project.path_with_namespace}/-/raw/${project.default_branch}/${m[2]}`
            fileContent = fileContent.replaceAll(m[2] as string, rewrittenURL);
        }

        return fileContent;
    }

    function deleteAllFilesInDir(dirPath : string, extension : string) {
        try {
            fs.readdirSync(dirPath).forEach(file => {
                if (file.endsWith(extension)) {
                    fs.rmSync(path.join(dirPath, file));
                }
            });
        } catch (error) {
            console.log(error);
        }
    }

    async function cleanContent() {
        const c = await findRemoteItems()

        for (const { location } of c) {
            console.log(`Now Deleting ${context.siteDir}/docs/${outDir}/${location}`);
            deleteAllFilesInDir(`${context.siteDir}/docs/${outDir}/${location}`, '.md');
        }
    }


    // noinspection JSUnusedGlobalSymbols
    return {
        //name: `docusaurus-plugin-gitlab-content-${name}`,
        name: `docusaurus-plugin-gitlab2-content`,

        async postBuild(): Promise<void> {
            if (performCleanup) {
                return await cleanContent()
            }
        },

        extendCli(cli): void {
            cli.command(`download-remote-${name}`)
                .description(`Downloads the remote ${name} data.`)
                .action(async () => await timeIt(`fetch ${name}`, fetchGitLabContent))

            cli.command(`clear-remote-${name}`)
                .description(
                    `Removes the local copy of the remote ${name} data.`
                )
                .action(async () => await timeIt(`clear ${name}`, cleanContent))
        },
    }
}

export * from "./types"
