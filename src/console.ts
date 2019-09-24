import { Widget } from "./widget";
import { createElement, array_last } from "./util";

export class ConsoleWidget extends Widget
{
    private cursorSwitch : boolean = false;
    private cursorElement : HTMLElement;
    private textElement : HTMLElement;
    protected inputStartIndex : number = 0;

    constructor(container? : HTMLElement)
    {
        super(container || createElement("div", "console"));

        this.createEvent("return");

        this.textElement = createElement("span", "text");

        this.cursorElement = createElement("span", "cursor");
        this.cursorElement.innerText = "_";

        this.appendChild(this.textElement);
        this.appendChild(this.cursorElement);

        this.container.tabIndex = 0;

        this.container.addEventListener("keypress", e =>
        {
            if (e.key === "Enter")
            {
                let lastLine = this.lastLine;
                this.value += "\n";
                this.emitEvent("return", lastLine);
            }
            else
            {
                this.value += e.key;
            }
        });

        this.container.addEventListener("keydown", e =>
        {
            switch (e.key)
            {
                case "Backspace":
                    if (this.value.length > 0 && this.value.length > this.inputStartIndex)
                    {
                        this.value = this.value.substr(0, this.value.length - 1);
                    }
                    break;
                case "Delete":
                    if (this.value.length > 0)
                    {
                        // uhh deal with this later
                    }
                    break;
            }
        });

        window.setInterval(this.blinkCursor.bind(this), 500);
    }

    protected get lastLine() : string
    {
        return array_last(this.value.split("\n"));
    }

    private blinkCursor() : void
    {
        this.cursorSwitch = !this.cursorSwitch;
        if (this.cursorSwitch)
        {
            this.cursorElement.style.display = "";
        }
        else
        {
            this.cursorElement.style.display = "none";
        }
    }

    public get value() : string
    {
        return this.textElement.innerText;
    }

    public set value(value : string)
    {
        this.textElement.innerText = value;
    }

    public clear() : void
    {
        this.value = "";
        this.inputStartIndex = 0;
    }

    public prompt(prompt : string, clear : boolean = false)
    {
        clear && this.clear();

        this.value += prompt;
        this.inputStartIndex = this.value.length;
    }

    public print(str : string, important : boolean = true) : void
    {
        this.value += str;

        if (important)
        {
            this.container.scrollTop = this.container.scrollHeight;
        }
    }

    public println(str : string = "") : void
    {
        this.print(str + "\n");
    }
}