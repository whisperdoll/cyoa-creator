import { Widget } from "./widget";
import { createElement } from "./util";
import { Node, NodeExportable } from "./node"
import { NodeCanvasExportable } from "./nodecanvas";
import { ConsoleWidget } from "./console";

export class Player extends ConsoleWidget
{
    private nodes : { [id : number] : Node } = {};
    private currentNode : Node;
    private startingNode : Node;

    constructor()
    {
        super(createElement("div", "console player"));

        this.on("return", this.processChoice.bind(this));
    }

    public load(exportable : NodeCanvasExportable)
    {
        this.nodes = {};
        this.clear();

        exportable.nodes.forEach(nodeExportable =>
        {
            this.nodes[nodeExportable.id] = Node.fromExportable(nodeExportable);
        });

        this.startingNode = this.nodes[exportable.defaultNodeId];
    }

    public play()
    {
        if (!this.startingNode)
        {
            alert("no starting node sorry");
        }
        else
        {
            this.displayNode(this.startingNode);
        }
    }

    private displayNode(node : Node) : void
    {
        let prompt = node.text + "\n\n" + node.options.map((option, i) => (i + 1) + "> " + option.text).join("\n") + "\n\n";
        this.prompt(prompt, false);
        this.currentNode = node;
    }

    private isInvalidChoice(num : number) : boolean
    {
        return num < 1 || num > this.currentNode.options.length;
    }

    private processChoice(line : string)
    {
        let num = parseInt(line);

        if (isNaN(num) || this.isInvalidChoice(num))
        {
            this.println("Sorry but that's not really valid... try again");
            return;
        }

        // its ok //
        this.handleChoice(num);
    }

    private handleChoice(validNum : number) : void
    {
        this.println();
        this.displayNode(this.nodes[this.currentNode.options[validNum - 1].nextNodeId]);
    }
}