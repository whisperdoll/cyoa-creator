import { Dialog } from "./dialog";
import { Option } from "./option";
import { Node } from "./node";
import { createElement, createOptionElement, stopProp } from "./util";

export type OptionDialogResponse = "save" | "cancel" | "delete";

export class OptionDialog extends Dialog
{
    private option : Option = null;
    private nodes : Node[] = [];

    private textInput : HTMLInputElement;
    private codeInput : HTMLTextAreaElement;
    private nodeSelect : HTMLSelectElement;

    private buttonBar : HTMLElement;
    private saveButton : HTMLElement;
    private deleteButton : HTMLElement;
    private cancelButton : HTMLElement;

    constructor()
    {
        super();

        this.createEvent("return");

        this.container.classList.add("optionDialog");
        this.container.addEventListener("mousedown", stopProp);

        this.textInput = <HTMLInputElement>createElement("input", "text");
        this.textInput.type = "text";
        this.textInput.placeholder = "Option text...";

        this.codeInput = <HTMLTextAreaElement>createElement("textarea", "code");
        this.codeInput.placeholder = "Code...";
        
        this.nodeSelect = <HTMLSelectElement>createElement("select", "nodes");
        
        this.saveButton = createElement("button", "save");
        this.saveButton.addEventListener("click", this.save.bind(this));
        this.saveButton.innerText = "Save";
        
        this.deleteButton = createElement("button", "delete");
        this.deleteButton.addEventListener("dblclick", this.delete.bind(this));
        this.deleteButton.innerText = "Delete";
        
        this.cancelButton = createElement("button", "cancel");
        this.cancelButton.addEventListener("click", this.cancel.bind(this));
        this.cancelButton.innerText = "Cancel";

        this.buttonBar = createElement("div", "buttons");
        this.buttonBar.appendChild(this.saveButton);
        this.buttonBar.appendChild(this.deleteButton);
        this.buttonBar.appendChild(this.cancelButton);

        this.appendChild(
            this.textInput,
            this.codeInput,
            this.nodeSelect,
            this.buttonBar
        );

        this.on("backdropclick", () =>
        {
            this.emitEvent("return", <OptionDialogResponse>"cancel");
        });
    }

    public show(option? : Option, nodes? : Node[]) : void
    {
        if (!option || !nodes)
        {
            throw "ok u actually have to give those arguments";
        }

        this.option = option;
        this.nodes = nodes;
        this.updateGUI();

        super.show();
    }

    private updateGUI() : void
    {
        this.textInput.value = this.option.text;
        this.codeInput.value = this.option.code;
        
        this.nodeSelect.innerHTML = ""; // lol

        this.nodeSelect.add(createOptionElement("(none)", Node.INVALID_ID.toString()));

        this.nodes.forEach(node =>
        {
            let o = createOptionElement("[" + node.id.toString() + "] " + node.name, node.id.toString());
            this.nodeSelect.add(o);
        });

        this.nodeSelect.value = this.option.nextNodeId.toString();
    }

    private save() : void
    {
        this.option.text = this.textInput.value;
        this.option.code = this.codeInput.value;
        this.option.nextNodeId = parseInt(this.nodeSelect.value);
        this.hide();
        this.emitEvent("return", <OptionDialogResponse>"save");
    }

    private delete() : void
    {
        this.hide();
        this.emitEvent("return", <OptionDialogResponse>"delete");
    }

    private cancel() : void
    {
        this.hide();
        this.emitEvent("return", <OptionDialogResponse>"cancel");
    }
}