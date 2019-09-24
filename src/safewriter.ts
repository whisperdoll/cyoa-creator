import * as fs from "fs";
import { fileExists } from "./util";

type CallbackFn = (err : Error) => void;
type FsCallbackFn = (err : Error, stat : fs.Stats) => void;
type QueueItem = { data : string | Buffer, cb? : CallbackFn };

export class SafeWriter
{
    private static queues : { [fid : string] : QueueItem[] } = {};

    public static bigintStat(filename : string, cb : FsCallbackFn)
    {
        (fs as any).stat(filename, { bigint: true }, cb);
    }

    public static write(filename : string, data : string | Buffer, cb? : CallbackFn, fid? : string)
    {
        if (!fileExists(filename))
        {
            fs.writeFileSync(filename, "");
        }

        let doWrite = (fid : string) =>
        {
            if (!this.queues.hasOwnProperty(fid))
            {
                this.queues[fid] = [];
            }

            let currentlyWriting = this.queues[fid].length > 0;
            this.queues[fid].push({
                data: data,
                cb: cb
            });

            if (!currentlyWriting)
            {
                if (typeof(data) === "string")
                {
                    fs.writeFile(filename, data, "utf8", (err) =>
                    {
                        this.callbackFn(err, filename, fid);
                    });
                }
                else
                {
                    fs.writeFile(filename, data, (err) =>
                    {
                        this.callbackFn(err, filename, fid);
                    });
                }
            }
        };

        if (fid)
        {
            doWrite(fid);
        }
        else
        {
            this.bigintStat(filename, (err : Error, stat : fs.Stats) =>
            {
                if (err)
                {
                    throw err;
                }
    
                let fid = stat.ino.toString();
    
                doWrite(fid);
            });
        }
    }

    private static callbackFn(err : Error, filename : string, fid : string)
    {
        let justFinished = this.queues[fid].shift();

        if (justFinished.cb)
        {
            justFinished.cb(err);
        }

        if (this.queues[fid].length > 0)
        {
            let data = this.queues[fid][0].data;

            if (typeof(data) === "string")
            {
                fs.writeFile(filename, data, "utf8", (err) =>
                {
                    this.callbackFn(err, filename, fid);
                });
            }
            else
            {
                fs.writeFile(filename, data, (err) =>
                {
                    this.callbackFn(err, filename, fid);
                });
            }
        }

        if (err && !justFinished.cb)
        {
            throw err;
        }
    }
}