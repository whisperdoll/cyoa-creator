import { Widget } from "./widget";
import { createElement } from "./util";
import { Node } from "./node";

export interface OptionExportable
{
    text : string,
    code : string,
    nextNodeId : number
}

export class Option extends Widget
{
    private _text : string = "";
    public code : string = "";
    private _nextNodeId : number = Node.INVALID_ID;

    constructor(text : string = "", code : string = "", nextNodeId : number = Node.INVALID_ID)
    {
        super(createElement("span", "option"));
        this.text = text;
        this.code = code;
        this.nextNodeId = nextNodeId;
        this.updateText();
    }

    public set nextNodeId(nextNodeId : number)
    {
        this._nextNodeId = nextNodeId;
        this.updateText();
    }

    public get nextNodeId() : number
    {
        return this._nextNodeId;
    }

    public set text(text : string)
    {
        this._text = text;
        this.updateText();
    }

    public get text() : string
    {
        return this._text;
    }

    private updateText()
    {
        this.container.innerText = "[" + this.nextNodeId.toString() + "] " + this._text;
    }

    public getNextNode(nodeFromIdFn : (id : number) => Node) : Node
    {
        return nodeFromIdFn(this.nextNodeId);
    }

    public get exportable() : OptionExportable
    {
        let ret =
        {
            text: this.text,
            code: this.code,
            nextNodeId: this.nextNodeId
        };
        
        return ret;
    }

    public static fromExportable(exportable : OptionExportable) : Option
    {
        return new Option(exportable.text, exportable.code, exportable.nextNodeId);
    }
}