import type { LoadContext, Plugin } from "@docusaurus/types"
import axios from "axios"
import { existsSync, writeFileSync, mkdirSync } from "fs"
//import { join } from "path"

import { timeIt } from "./utils"
import { Fetchable, GitLabContentPluginOptions } from "./types"
import fs from "fs";

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
        rewriteImages  = true
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
            a.push({ location })
        }

        return a
    }

    // async function getTargetDirectory(): Promise<string> {
    //     const returnValue = join(context.siteDir, outDir)
    //
    //     if (!existsSync(returnValue)) {
    //         mkdirSync(returnValue, { recursive: true })
    //     }
    //
    //     return returnValue
    // }

    async function fetchGitLabContent() {
        console.log("Entering fetchGitLabContent")
        //cleanContent();
        const c = await findRemoteItems();

        let promises = [];

        for (let { location } of c) {
            console.log("Looping ", location)
            console.log(`${sourceBaseUrl}/api/v4/search?scope=projects&search=${location}`);

            promises.push(
                axios.get(
                    `${sourceBaseUrl}/api/v4/search?scope=projects&search=${location}`,
                    requestConfig
                ).then(response => {
                    if (!existsSync(location)) {
                        console.log(`mkDirSync = ${context.siteDir}/${outDir}/${location}`)
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
                console.log(`URL to download = ${sourceBaseUrl}/api/v4/projects/${project.id}/repository/files/README.md/raw`);
                axios.get(
                    `${sourceBaseUrl}/api/v4/projects/${project.id}/repository/files/README.md/raw`,
                    requestConfig
                ).then(response => {
                    console.log(`Writing to = ${context.siteDir}/${outDir}/${location}/${project.name}-README.md`);
                    console.log("Received file = ", response.data);
                    if (rewriteImages) {
                        let rewrittenData: string = rewriteImagesURLs(response.data, location, project);
                        writeFileSync(`${context.siteDir}/${outDir}/${location}/${project.name}-README.md`, rewrittenData);
                    }
                    else {
                        writeFileSync(`${context.siteDir}/${outDir}/${location}/${project.name}-README.md`, response.data);
                    }
                }).catch(
                    reason => {
                        console.log("Error: ", reason)
                    }
                )
            }
        }
    }

    function rewriteImagesURLs(fileContent: string, location: string, project: any) : string {
        let m : RegExpExecArray | null,
            rex = /\[([^\[]+)\]\((.*\.(jpg|png|gif|jpeg|JPG|PNG|GIF|JPEG))\)/gm;

        while ( m = rex.exec( fileContent ) ) {
            let rewrittenURL = `${sourceBaseUrl}/${location}/${project.path_with_namespace}/-/raw/master/${m[2]}`
            fileContent = fileContent.replaceAll(m[2] as string, rewrittenURL);
        }

        return fileContent;
    }

    // async function fetchContent_old(): Promise<void> {
    //     const c = await findRemoteItems()
    //
    //     for (const { id } of c) {
    //         //#region Run modifyContent (and fetch the data)
    //         let content = (
    //             await axios({
    //                 //https://gitlab.autozone.com
    //                 baseURL: sourceBaseUrl + '/api/v4/search?scope=projects&search=supply-chain/services',
    //                 url: id,
    //                 ...requestConfig,
    //             })
    //         ).data
    //         let newIdent = id
    //
    //         const called = modifyContent?.(newIdent, content)
    //
    //         let cont = called?.content
    //         if (cont && typeof cont === "string") {
    //             content = cont
    //         }
    //
    //         let fn
    //         if ((fn = called?.filename) && typeof fn === "string") {
    //             newIdent = fn
    //         }
    //         //#endregion
    //
    //         const checkIdent = newIdent.split("/").filter((seg) => seg !== "")
    //         checkIdent.pop()
    //
    //         // if we are outputting to a subdirectory, make sure it exists
    //         if (checkIdent.length > 0) {
    //             mkdirSync(
    //                 join(await getTargetDirectory(), checkIdent.join("/")),
    //                 { recursive: true }
    //             )
    //         }
    //
    //         writeFileSync(join(await getTargetDirectory(), newIdent), content)
    //     }
    // }

    // async function cleanContent_old(): Promise<void> {
    //     const c = await findRemoteItems()
    //
    //     for (const { location } of c) {
    //         delFile(join(await getTargetDirectory(), id))
    //     }
    // }

    async function cleanContent() {
        const c = await findRemoteItems()

        for (const { location } of c) {
            //delFile(join(await getTargetDirectory(), id))
            fs.rmSync(`/home/oawad/myapps/WebstormProjects/gitlab-test/${location}`, {recursive: true, force: true});
        }
    }

    // if (!noRuntimeDownloads) {
    //     await fetchGitLabContent()
    // }

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
