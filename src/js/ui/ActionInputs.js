const actionTypes = ["inject", "cs-inject", "bg-inject", "bg-function", "change",
                     "check", "click", "submit-click", "update", "timer",
                     "redirect", "copy", "pause"];
const secondaryDisabled = ["inject", "cs-inject", "bg-inject", "bg-function",
                      "check", "click", "submit-click", "update",
                      "redirect", "copy", "pause"];
const mainDisabled = ["update", "timer", "pause"];
const revertInputs = ["timer"];

class ActionInputs {
    constructor(type, main, secondary) {
      this.typeInput = document.querySelector(type);
      this.mainInput = document.querySelector(main);
      this.secondaryInput = document.querySelector(secondary);
      this.typeInput.addEventListener("change", this.onTypeChange.bind(this));
      this._populateTypes();
    }

    get _type() {
      return this.typeInput.value;
    }

    set _type(value) {
      this.typeInput.value = value;
      this.onTypeChange();
    }

    get _main() {
      return this.mainInput.value;
    }

    set _main(value) {
      this.mainInput.value = value;
    }

    get _secondary() {
      return this.secondaryInput.value;
    }

    set _secondary(value) {
      this.secondaryInput.value = value;
    }

    isReverse() {
      return revertInputs.includes(this._type);
    }

    _populateTypes() {
      for (const actionType of actionTypes) {
        const option = document.createElement("option");
        option.value = actionType;
        option.textContent = actionType;
        this.typeInput.appendChild(option);
      }
    }

    reset() {
      this.typeInput.selectedIndex = 0;
      this._main = "";
      this._secondary = "";
    }

    getItem() {
      const inputs = [this._main, this._secondary];
      return {
        type: this._type,
        inputs: this.isReverse() ? inputs.reverse() : inputs
      }
    }

    setItem({type, inputs}) {
      if (type)
        this._type = type;
      else
        this.typeInput.selectedIndex = 0;

      if (!inputs) {
        this._main = "";
        this._secondary = "";
      }
      else if (this.isReverse()) {
        this._main = inputs[1] || "";
        this._secondary = inputs[0] || "";
      }
      else {
        this._main = inputs[0] || "";
        this._secondary = inputs[1] || "";
      }
    }

    onTypeChange() {
      this.mainInput.disabled = false;
      this.secondaryInput.disabled = false;
      const type = this._type;

      if (secondaryDisabled.includes(type))
      {
        this.secondaryInput.disabled = true;
      }
      if (mainDisabled.includes(type))
      {
        this.mainInput.disabled = true;
      }
    }
}

module.exports = ActionInputs;
