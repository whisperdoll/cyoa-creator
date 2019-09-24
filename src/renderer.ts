import { NodeCanvas } from "./nodecanvas";
import { Node } from "./node";
import * as fs from "fs";
import * as path from "path";
import { getUserDataPath, fileExists } from "./util";
import { Player } from "./player";
const app = require("electron").remote.app;

// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

let nodeCanvas : NodeCanvas;

if (!fileExists(getUserDataPath()))
{
    fs.mkdirSync(getUserDataPath());
}

if (!fileExists(path.join(getUserDataPath(), "game.cyoa")))
{
    fs.copyFileSync("./game.cyoa", path.join(getUserDataPath(), "game.cyoa"));
}

NodeCanvas.makeFromFilename(path.join(getUserDataPath(), "game.cyoa"), nc =>
{
    nodeCanvas = nc;
    
    (window as any).nodeCanvas = nodeCanvas;

    let player : Player = new Player();
    player.load(nodeCanvas.exportable);
    //player.play();

    //document.getElementById("container").appendChild(player.container);
    document.getElementById("container").appendChild(nodeCanvas.container);
});