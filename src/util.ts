import * as electron from "electron"
import * as path from "path"
import * as fs from "fs"
import { SafeWriter } from "./safewriter";

export type SortFunction<T> = (a : T, b : T) => boolean;

export function fileExists(filename : string) : boolean
{
    return fs.existsSync(filename);
}

export function createElement(type : string, className : string = "") : HTMLElement
{
    let ret = document.createElement(type);
    ret.className = className;
    return ret;
}

export function createOptionElement(text : string, value : string) : HTMLOptionElement
{
    let ret = document.createElement("option");
    ret.innerText = text;
    ret.value = value;

    return ret;
}

export function hideElement(element : HTMLElement) : void
{
    element.style.display = "none";
}

export function showElement(element : HTMLElement) : void
{
    element.style.display = "";
}

export function element_isScrolledTo(element : HTMLElement, allowPartial : boolean = false)
{
    let height = element.getBoundingClientRect().height;
    let top = element.offsetTop;
    let bottom = top + height;

    let parent = element.parentElement;
    let parentHeight = parent.getBoundingClientRect().height;
    let scrollTop = parent.scrollTop;
    
    if (allowPartial)
    {
        return !(scrollTop + parentHeight <= top || scrollTop >= bottom);
    }
    else
    {
        return !(scrollTop + parentHeight < bottom || scrollTop > top);
    }
}

export function element_scrollIntoView(element : HTMLElement, align : "top" | "center" | "bottom") : void
{
    let height = element.getBoundingClientRect().height;
    let top = element.offsetTop;
    let bottom = top + height;

    let parent = element.parentElement;
    let parentHeight = parent.getBoundingClientRect().height;
    let scrollHeight = parent.scrollHeight;

    switch (align)
    {
        case "top":
            parent.scrollTop = top;
            break;
        case "center":
            parent.scrollTop = parentHeight / 2 - height / 2;
            break;
        case "bottom":
            parent.scrollTop = bottom - parentHeight;
            break;
    }
}

export function element_scrollIntoViewIfNeeded(element : HTMLElement, align : "top" | "center" | "bottom", allowPartial : boolean) : void
{
    if (!element_isScrolledTo(element, allowPartial))
    {
        element_scrollIntoView(element, align);
    }
}

export function endsWith(str : string, endsWith : string) : boolean
{
    if (endsWith.length > str.length)
    {
        return false;
    }
    
    return str.substr(str.length - endsWith.length) === endsWith;
}

export function getFileId(filename : string, callback : (id : string) => void)
{
    SafeWriter.bigintStat(filename, (err : Error, stat : fs.Stats) =>
    {
        if (err)
        {
            throw err;
        }
        
        callback(stat.ino.toString());
    });
}
    
export function getUserDataPath() : string
{
    let upath = (electron.app || electron.remote.app).getPath("userData");
    return path.join(upath, "cyoa/");
}

export function getCacheFilename(filename : string, callback : (filename : string, fid? : string) => void)
{
    getFileId(filename, (fid : string) =>
    {
        let dataPath = getUserDataPath();
        let filePath = path.join(dataPath, fid + ".cache");
        callback(filePath, fid);
    });
}

export function readCacheFile(filename : string, callback : (data : string) => void)
{
    getCacheFilename(filename, (cacheFilename : string) =>
    {
        fs.readFile(cacheFilename, "utf8", (err, data) =>
        {
            if (err)
            {
                throw err;
            }
            
            callback(data);
        });
    });
}

export function writeCacheFile(filename : string, data : string | Buffer, callback? : () => void) : void
{
    getCacheFilename(filename, (cacheFilename : string, fid : string) =>
    {
        SafeWriter.write(cacheFilename, data, callback, fid);
    });
}

// https://github.com/basarat/algorithms/blob/master/src/mergeSorted/mergeSorted.ts
export function mergeSorted<T>(array: T[], compareFn : SortFunction<T>): T[] {
    if (array.length <= 1) {
        return array;
    }
    const middle = Math.floor(array.length / 2);
    const left = array.slice(0, middle);
    const right = array.slice(middle);
    
    return merge<T>(mergeSorted(left, compareFn), mergeSorted(right, compareFn), compareFn);
}

/** Merge (conquer) step of mergeSorted */
function merge<T>(left: T[], right: T[], compareFn : SortFunction<T>): T[] {
    const array: T[] = [];
    let lIndex = 0;
    let rIndex = 0;
    while (lIndex + rIndex < left.length + right.length) {
        const lItem = left[lIndex];
        const rItem = right[rIndex];
        if (lItem == null) {
            array.push(rItem); rIndex++;
        }
        else if (rItem == null) {
            array.push(lItem); lIndex++;
        }
        else if (compareFn(lItem, rItem)) {
            array.push(lItem); lIndex++;
        }
        else {
            array.push(rItem); rIndex++;
        }
    }
    return array;
}

export function emptyFn() {}

export function array_contains<T>(array: T[], item : T) : boolean
{
    return array.indexOf(item) !== -1;
}

export function array_remove<T>(array : T[], item : T) : { item : T, index : number, existed : boolean }
{
    let index = array.indexOf(item);
    if (index !== -1)
    {
        array.splice(index, 1);
        return { item, index, existed: true };
    }

    return { item, index: -1, existed: false };
}

export function array_item_at<T>(array : T[], index : number) : T
{
    if (index >= array.length)
    {
        return array[index % array.length];
    }
    else if (index < 0)
    {
        return array[array.length - (-index % array.length)];
    }
    else
    {
        return array[index];
    }
}

export function array_remove_at<T>(array : T[], index : number) : { item : T, index : number, existed : boolean }
{    
    if (index !== -1)
    {
        return { item: array.splice(index, 1)[0], index, existed: true };
    }

    return { item: null, index: -1, existed: false };
}

export function array_insert<T>(array : T[], item : T, index_or_fn : number | SortFunction<T>) : { item : T, index : number }
{
    if (typeof index_or_fn === "number")
    {
        array.splice(index_or_fn, 0, item);
        return { item: item, index: index_or_fn };
    }
    else
    {
        for (let i = 0; i < array.length; i++)
        {
            if (index_or_fn(item, array[i]))
            {
                array.splice(i, 0, item);
                return { item: item, index: i };
            }
        }

        array.push(item);
        return { item: item, index: array.length - 1 };
    }

}

export function array_copy<T>(array : T[]) : T[]
{
    return array.slice();
}

export function array_shuffle<T>(array : T[]) : void
{
    let i = 0;
    let j = 0;
    let temp = null;
    
    for (i = array.length - 1; i > 0; i -= 1)
    {
        j = Math.floor(Math.random() * (i + 1));
        temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}

export function array_insert_random<T>(array : T[], item : T) : { index : number, item : T }
{
    let index = Math.floor(Math.random() * (array.length + 1));
    return array_insert(array, item, index);
}

export function array_last<T>(array : T[]) : T
{
    return array[array.length - 1];
}

export function array_swap<T>(array : T[], a : number | T, b : number | T) : void
{
    if (typeof(a) !== "number")
    {
        a = array.indexOf(a);
    }

    if (typeof(b) !== "number")
    {
        b = array.indexOf(b);
    }

    let temp = array[a];
    array[a] = array[b];
    array[b] = temp;
}

export function stopProp(e : MouseEvent) : void
{
    e.stopPropagation();
}

export function getRainbowColor(n : number) : string
{
    let r = ~~(255 * (n < 0.5 ? 1 : 1 - 2 * (n - 0.5)));
    let g = ~~(255 * (n < 0.5 ? 2 * n : 1));
    let b = ~~(255 * (n > 0.5 ? 2 * (n - 0.5) : 0));
    let color = "rgb(" + r + "," + g + "," + b + ")";
    return color;
}

export function getCurrentMs() : number
{
    return Date.now();
}

export function sign(n : number) : number
{
    return (n > 0 ? 1 : (n < 0 ? -1 : 0));
}