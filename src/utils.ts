import picocolors from "picocolors"
import milli from "pretty-ms"

export async function timeIt(
    name: string,
    action: () => Promise<void>
): Promise<void> {
    const startTime = new Date()
    await action()
    console.log(
        `${picocolors.green(`Task ${name} done (took `)} ${picocolors.white(
            milli((new Date() as any) - (startTime as any))
        )}${picocolors.green(`)`)}`
    )
}

export function getUnclosedTags(source : string) {

    let DOMHolderArray = [];
    let lines = source.split('\n');
    let elementToPop;
    for (let x = 0; x < lines.length; x++) {
        let tagsArray = lines[x]?.match(/<(\/{1})?\w+((\s+\w+(\s*=\s*(?:".*?"|'.*?'|[^'">\s]+))?)+\s*|\s*)>/g);
        if (tagsArray) {
            for (let i = 0; i < tagsArray.length; i++) {
                // @ts-ignore
                if (tagsArray[i].indexOf('</') >= 0) {
                    // @ts-ignore
                    elementToPop = tagsArray[i].substr(2, tagsArray[i].length - 3);
                    elementToPop = elementToPop.replace(/ /g, '');
                    for (let j = DOMHolderArray.length - 1; j >= 0; j--) {
                        if (DOMHolderArray[j].element == elementToPop) {
                            DOMHolderArray.splice(j, 1);
                            if (elementToPop != 'html') {
                                break;
                            }
                        }
                    }
                } else {
                    let tag : any = {};
                    tag.full = tagsArray[i];
                    tag.line = x + 1;
                    if (tag.full.indexOf(' ') > 0) {
                        tag.element = tag.full.substr(1, tag.full.indexOf(' ') - 1);
                    } else {
                        tag.element = tag.full.substr(1, tag.full.length - 2);
                    }
                    let selfClosingTags = ['area', 'base', 'br', 'col', 'command', 'embed', 'hr', 'img', 'input', 'keygen', 'link', 'meta', 'param', 'source', 'track', 'wbr'];
                    let isSelfClosing = false;
                    for (let y = 0; y < selfClosingTags.length; y++) {
                        if (selfClosingTags[y]?.localeCompare(tag.element) == 0) {
                            isSelfClosing = true;
                        }
                    }
                    if (!isSelfClosing) {
                        DOMHolderArray.push(tag);
                    }
                }

            }
        }
    }

    let tags = [];
    if (DOMHolderArray.length == 0) {
    } else {
        for (let i = 0; i < DOMHolderArray.length; i++) {
            tags.push(DOMHolderArray[i].full)
            // let tagSanitized = DOMHolderArray[i].full.replace(/>/g, '&gt;');
            // tagSanitized = DOMHolderArray[i].full.replace(/</g, '&lt;');
            //message += tagSanitized;

        }


    }


    return tags;
}
