import { createElement, stopProp, array_contains, array_remove } from "./util";
import { Widget } from "./widget";
import { Option, OptionExportable } from "./option";
import { OptionDialog } from "./optiondialog";

export interface NodeExportable
{
    name : string,
    x : number,
    y : number,
    text : string,
    options : OptionExportable[],
    id : number,
    width : number,
    height: number
}

export class Node extends Widget
{
    public static INVALID_ID = -1;

    private _name : string = "new node";
    public options : Option[] = [];
    public dragging : boolean = false;
    public readonly id : number;

    private dragBar : HTMLElement;
    private idElement : HTMLElement;
    private nameElement : HTMLElement;
    private editNameButton : HTMLElement;
    private textElement : HTMLTextAreaElement;
    private addOptionButton : HTMLElement;
    private bottomBar : HTMLElement;

    constructor(id : number)
    {
        super(createElement("div", "node"));

        if (id === Node.INVALID_ID)
        {
            throw "invalid id idiot";
        }

        this.createEvent("requesteditoption");
        this.createEvent("namechange");

        this.id = id;

        this.container.addEventListener("mousedown", stopProp);

        this.dragBar = createElement("div", "dragBar");
        this.dragBar.addEventListener("mousedown", () =>
        {
            this.dragging = true;
        });
        this.dragBar.addEventListener("mouseup", () =>
        {
            this.dragging = false;
        });

        this.idElement = createElement("span", "id");

        this.nameElement = createElement("span", "name");
        this.nameElement.addEventListener("keydown", (e) =>
        {
            if (this.nameElement.contentEditable === "true")
            {
                if (e.which === 13) // enter
                {
                    this.nameElement.contentEditable = "false";
                    this._name = this.nameElement.innerText;
                    this.nameElement.classList.remove("editing");
                    this.emitEvent("namechange", this.name);
                }
                else if (e.which === 27) // esc
                {
                    this.nameElement.contentEditable = "false";
                    this.nameElement.innerText = this._name;
                    this.nameElement.classList.remove("editing");
                }
            }
        });
        this.nameElement.addEventListener("dblclick", () =>
        {
            if (this.nameElement.contentEditable !== "true")
            {
                this.promptEditName();
            }
        });

        this.editNameButton = createElement("button", "editName");
        this.editNameButton.innerText = "Edit";
        this.editNameButton.addEventListener("click", this.promptEditName.bind(this));

        this.dragBar.appendChild(this.idElement);
        this.dragBar.appendChild(this.nameElement);

        this.textElement = <HTMLTextAreaElement>createElement("textarea", "text");

        this.bottomBar = createElement("div", "options");

        this.addOptionButton = createElement("span", "add option");
        this.addOptionButton.innerText = "+";
        this.addOptionButton.addEventListener("click", this.promptNewOption.bind(this));

        this.bottomBar.appendChild(this.addOptionButton);

        this.appendChild(
            this.dragBar,
            this.textElement,
            this.bottomBar
        );

        this.updateDragBar();
    }

    public get name() : string
    {
        return this._name;
    }

    public set name(name : string)
    {
        this._name = name;
        this.updateDragBar();
    }

    private updateDragBar() : void
    {
        this.idElement.innerHTML = "[" + this.id.toString() + "]&nbsp;";
        this.nameElement.innerText = this.name;
    }

    public get x() : number
    {
        return this.container.offsetLeft;
    }

    public set x(x : number)
    {
        this.container.style.left = x + "px";
    }

    public get y() : number
    {
        return this.container.offsetTop;
    }

    public set y(y : number)
    {
        this.container.style.top = y + "px";
    }

    public get width() : number
    {
        return this.container.offsetWidth;
    }

    public set width(width : number)
    {
        this.container.style.width = width + "px";
    }

    public get height() : number
    {
        return this.container.offsetHeight;
    }

    public set height(height : number)
    {
        this.container.style.height = height + "px";
    }

    public get text() : string
    {
        return this.textElement.value;
    }

    public set text(text : string)
    {
        this.textElement.value = text;
    }

    public get exportable() : NodeExportable
    {
        return {
            name: this.name,
            id: this.id,
            options: this.options.map(option => option.exportable),
            text: this.text,
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }

    public static fromExportable(exportable : NodeExportable) : Node
    {
        let ret = new Node(exportable.id);
        ret.name = exportable.name;
        ret.text = exportable.text;
        ret.x = exportable.x;
        ret.y = exportable.y;
        ret.width = exportable.width;
        ret.height = exportable.height;
        
        exportable.options.forEach(optionExportable =>
        {
            ret.addOption(Option.fromExportable(optionExportable));
        });

        return ret;
    }

    private promptEditName() : void
    {
        this.nameElement.classList.add("editing");
        this.nameElement.contentEditable = "true";
        
        let range = document.createRange();
        range.selectNodeContents(this.nameElement);
        let sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    }

    public addOption(option : Option)
    {
        if (!array_contains(this.options, option))
        {
            this.options.push(option);
            this.bottomBar.appendChild(option.container);
            option.container.addEventListener("click", this.optionClicked.bind(this, option));
        }
    }

    public deleteOption(option : Option)
    {
        let existed = array_remove(this.options, option).existed;

        if (existed)
        {
            this.bottomBar.removeChild(option.container);
        }
    }

    private promptNewOption(e : MouseEvent)
    {
        let option = new Option("", "", Node.INVALID_ID);
        this.promptEditOption(option);
    }

    private promptEditOption(option : Option)
    {
        this.emitEvent("requesteditoption", option, () =>
        {
            if (!array_contains(this.options, option))
            {
                this.addOption(option);
            }
        });
    }

    private optionClicked(option : Option)
    {
        this.promptEditOption(option);
    }
}