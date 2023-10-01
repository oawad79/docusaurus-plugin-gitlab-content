import type { LoadContext, Plugin } from "@docusaurus/types"
import axios from "axios"
import { existsSync, writeFileSync, mkdirSync } from "fs"

import {timeIt} from "./utils"
import {GitLabContentPluginOptions} from "./types"
import path from "path";

import { JSDOM } from 'jsdom';
import DOMPurify from 'dompurify';

const window = new JSDOM('').window;
const purify = DOMPurify(window);


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
        //escapeTags,
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

        for (let group of groups) {
            if (!excludeGroups || !excludeGroups?.includes(group.name.toLowerCase())) {
                console.log("Processing group = ", group.name);
                promises.push(fetchGroupData(group));
            }
        }

        await Promise.all(promises);
    }

    async function fetchGroupData(group: any) {
        if (!existsSync(`${context.siteDir}/${outDir}/${group.path}`)) {
            mkdirSync(`${context.siteDir}/${outDir}/${group.path}`, {recursive: true});
        }

        let currentPage = 1;
        let totalPages = 1;
        do {
            console.log(`${sourceBaseUrl}/api/v4/groups/${group.id}/projects?per_page=100&page=${currentPage}&include_subgroups=true`);
            //promises.push(
            let response = await axios.get(
                `${sourceBaseUrl}/api/v4/groups/${group.id}/projects?per_page=100&page=${currentPage}&include_subgroups=true`,
                requestConfig
            );

            totalPages = response.headers['x-total-pages'];
            console.log(`${group} Total pages = `, totalPages);
            fetchContent(response.data);

            currentPage++;
        } while (currentPage <= totalPages);
    }

    // let tagsToReplace = {
    //     // '&': '&amp;',
    //     '<': '&lt;',
    //     '>': '&gt;'
    // };
    //
    // function replaceTag(tag : string) {
    //     // @ts-ignore
    //     return tagsToReplace[tag] || tag;
    // }
    //
    // function safeTagsReplace(str : string) {
    //     return str.replace(/[<>]/g, replaceTag);
    // }

    function stringInsert(text : string, index : number, toInsert: string) {
        if (index > 0)
        {
            return text.substring(0, index) + toInsert + text.substring(index, text.length);
        }

        return toInsert + text;
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


                        //let markdown = turndownService.turndown(response.data);
                        let markdown = purify.sanitize(response.data,  {FORBID_TAGS: ['ins'], USE_PROFILES: {html: true, svg: true, svgFilters: true}});

                        if (rewriteImages) {
                            markdown = rewriteImagesURLs(markdown, project);
                            //
                            if (replaceTextWithAnother) {
                                replaceTextWithAnother.forEach(value => {
                                    markdown = markdown.replaceAll(value.replace, value.replaceWith);
                                });
                            }

                            // let unclosedTags = getUnclosedTags(markdown);
                            // for (let tag of unclosedTags) {
                            //     markdown = markdown.replaceAll(tag, "");
                            //     let closingTag = stringInsert(tag, 1, "/");
                            //     markdown = markdown.replaceAll(closingTag, "");
                            // }
                            //
                            // // if (escapeTags) {
                            // //     rewrittenData = safeTagsReplace(rewrittenData);
                            // // }

                            writeFileSync(`${context.siteDir}/${outDir}/${project.path_with_namespace}/${project.name.trim()}.md`, markdown);
                        } else {
                            writeFileSync(`${context.siteDir}/${outDir}/${project.path_with_namespace}/${project.name.trim()}.md`, markdown);
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
            m2 : RegExpExecArray | null,
            m3 : RegExpExecArray | null,
            rex = /\[([^\[]+)?\]\((.*\.(jpg|png|gif|jpeg|svg|pdf|JPG|PNG|GIF|JPEG|SVG|PDF)).*\)/gm,
            removeRex = /\[([^\[]+)?\]\(\)/gm,
            imgRex = /(<img("[^"]*"|[^>])+)(?<!\/)>/gm;

        while ( m = rex.exec( fileContent ) ) {
            let rewrittenURL = `${sourceBaseUrl}/${project.path_with_namespace}/-/raw/${project.default_branch}/${m[2]}`
            //console.log('rewrittenURL = ', rewrittenURL);
            fileContent = fileContent.replaceAll(m[2] as string, rewrittenURL);
        }

        //remove all empty ones like [blah](empty)
        while ( m2 = removeRex.exec( fileContent ) ) {
            fileContent = fileContent.replaceAll(m2[2] as string, "");
        }

        while ( m3 = imgRex.exec( fileContent ) ) {
            let newImgTag = stringInsert(m3[2] as string, (m3[2] as string).length, "/")
            fileContent = fileContent.replaceAll(m3[2] as string, newImgTag);
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
