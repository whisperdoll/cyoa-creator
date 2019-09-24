import { createElement, array_contains, fileExists, createOptionElement } from "./util";
import { Widget } from "./widget";
import { Node, NodeExportable } from "./node"
import * as fs from "fs";
import * as path from "path";
import { SafeWriter } from "./safewriter";
import { OptionDialog, OptionDialogResponse } from "./optiondialog";
import { Option } from "./option";

export interface NodeCanvasExportable
{
    nodes : NodeExportable[],
    defaultNodeId : number
}

export class NodeCanvas extends Widget
{
    private lastPos : { x : number, y : number };
    private mouseIsDown : boolean = false;
    private nodes : Node[] = [];
    private filename : string;

    private buttonContainer : HTMLElement;
    private addButton : HTMLElement;
    private saveButton : HTMLElement;
    private helpButton : HTMLElement;
    private defaultCombobox : HTMLSelectElement;

    private optionDialog : OptionDialog;

    private constructor(filename : string)
    {
        super(createElement("div", "nodeCanvas"));

        this.filename = filename;

        this.container.addEventListener("mousedown", this.mousedown.bind(this));
        this.container.addEventListener("mouseup", this.mouseup.bind(this));
        this.container.addEventListener("mousemove", this.mousemove.bind(this));

        this.addButton = createElement("button", "add");
        this.addButton.innerText = "Add Node";
        this.addButton.addEventListener("click", this.addNode.bind(this, null));

        this.saveButton = createElement("button", "save");
        this.saveButton.innerText = "Save";
        this.saveButton.addEventListener("click", this.save.bind(this));

        this.helpButton = createElement("button", "save");
        this.helpButton.innerText = "I'm lost";
        this.helpButton.addEventListener("click", this.recenter.bind(this));

        let defaultLabel = createElement("span", "defaultLabel");
        defaultLabel.innerText = "Starting Node: ";
    
        this.defaultCombobox = <HTMLSelectElement>createElement("select", "defaultCombobox");
        this.defaultCombobox.add(createOptionElement("(none)", Node.INVALID_ID.toString()));

        this.buttonContainer = createElement("div", "buttonContainer");
        this.buttonContainer.appendChild(this.addButton);
        this.buttonContainer.appendChild(this.saveButton);
        this.buttonContainer.appendChild(this.helpButton);
        this.buttonContainer.appendChild(defaultLabel);
        this.buttonContainer.appendChild(this.defaultCombobox);

        this.optionDialog = new OptionDialog();

        this.appendChild(
            this.buttonContainer,
            this.optionDialog
        );

        window.setInterval(this.save.bind(this), 5 * 60 * 1000);
    }

    public save()
    {
        SafeWriter.write(this.filename, JSON.stringify(this.exportable), (err) =>
        {
            if (err)
            {
                throw err;
            }

            this.saveButton.innerText = "Saved!";

            window.setTimeout(() =>
            {
                this.saveButton.innerText = "Save";
            }, 1000);
        });
    }

    public addNode(node? : Node)
    {
        if (node)
        {
            this.container.appendChild(node.container);
            this.nodes.push(node);
            node.on("requesteditoption", (option : Option) =>
            {
                this.optionDialog.show(option, this.getNodesOtherThan(node));
                this.optionDialog.once("return", (value : OptionDialogResponse) =>
                {
                    //console.log(value);
                    if (value === "save")
                    {
                        node.addOption(option);
                    }
                    else if (value === "delete")
                    {
                        node.deleteOption(option);
                    }
                });
            });
            node.on("namechange", this.populateDefaultCombobox.bind(this));
        }
        else
        {
            this.addNode(new Node(this.genId()));
        }

        this.populateDefaultCombobox();
    }

    private populateDefaultCombobox() : void
    {
        let currentlySelected = this.defaultCombobox.value;

        // preserve first (none) //
        while (this.defaultCombobox.options.length > 1)
        {
            this.defaultCombobox.remove(1);
        }

        // popualte it //
        this.nodes.forEach(node =>
        {
            this.defaultCombobox.add(createOptionElement("[" + node.id + "] " + node.name, node.id.toString()));
        });

        this.defaultCombobox.value = currentlySelected;
    }

    private recenter() : void
    {
        if (this.nodes.length > 0)
        {
            let dx = -this.nodes[0].x;
            let dy = -this.nodes[0].y;

            this.nodes.forEach(node =>
            {
                node.x += dx;
                node.y += dy;
            });
        }
    }

    public genId() : number
    {
        let taken = this.nodes.map(node => node.id);
        let ret = 0;

        while (array_contains(taken, ret))
        {
            ret++;
        }

        return ret;
    }

    private getNodesOtherThan(node : Node) : Node[]
    {
        return this.nodes.filter(n => n !== node);
    }

    public get exportable() : NodeCanvasExportable
    {
        return {
            nodes: this.nodes.map(node => node.exportable),
            defaultNodeId: parseInt(this.defaultCombobox.value)
        };
    }

    private static fromExportable(exportable : NodeCanvasExportable, filename : string) : NodeCanvas
    {
        let ret = new NodeCanvas(filename);
        exportable.nodes.forEach(nodeExportable =>
        {
            ret.addNode(Node.fromExportable(nodeExportable));
        });

        if (exportable.defaultNodeId === undefined)
        {
            exportable.defaultNodeId = Node.INVALID_ID;
        }

        ret.populateDefaultCombobox();
        ret.defaultCombobox.value = exportable.defaultNodeId.toString();

        return ret;
    }

    public static makeFromFilename(filename : string, callback : (nodeCanvas : NodeCanvas) => void) : void
    {
        let fn = () =>
        {
            fs.readFile(filename, "utf8", (err, data) =>
            {
                if (err)
                {
                    throw err;
                }

                callback(this.fromExportable(JSON.parse(data), filename));
            });
        };

        if (!fileExists(filename))
        {
            SafeWriter.write(filename, JSON.stringify(this.defaultExportable), (err) =>
            {
                if (err)
                {
                    throw err;
                }

                fn();
            });
        }
        else
        {
            fn();
        }
    }

    public static get defaultExportable() : NodeCanvasExportable
    {
        return {
            nodes: [],
            defaultNodeId: Node.INVALID_ID
        };
    }

    private nodeFromId(id : number) : Node
    {
        if (id === Node.INVALID_ID)
        {
            return null;
        }
        else
        {
            return this.nodes.filter(node => node.id === id)[0] || null;
        }
    }

    private mousedown(e : MouseEvent)
    {
        this.lastPos = { x: e.clientX, y: e.clientY };
        this.mouseIsDown = true;
    }

    private mousemove(e : MouseEvent)
    {
        if (this.mouseIsDown)
        {
            if (!this.lastPos)
            {
                this.lastPos = { x: e.clientX, y: e.clientY };
            }

            let dx = e.clientX - this.lastPos.x;
            let dy = e.clientY - this.lastPos.y;

            this.nodes.forEach(node =>
            {
                node.x += dx;
                node.y += dy;
            });

            this.lastPos = { x: e.clientX, y: e.clientY };
        }
        else
        {
            let draggingNode = this.nodes.filter(node => node.dragging)[0];

            if (draggingNode)
            {
                if (!this.lastPos)
                {
                    this.lastPos = { x: e.clientX, y: e.clientY };
                }

                let dx = e.clientX - this.lastPos.x;
                let dy = e.clientY - this.lastPos.y;

                draggingNode.x += dx;
                draggingNode.y += dy;
    
                this.lastPos = { x: e.clientX, y: e.clientY };
            }
        }
    }

    private mouseup(e : MouseEvent)
    {
        this.lastPos = null;
        this.mouseIsDown = false;
        this.nodes.forEach(node =>
        {
            node.dragging = false;
        });
    }
}