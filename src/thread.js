export class InstructionError extends Error { }

export class Thread {
    constructor(globalMap, typeLoader, sub, args) {
        this._globalMap = globalMap;
        this._typeLoader = typeLoader;
        this.evaluationStack = [];
        this.callStack = [new Thread.StackFrame(sub, args)];
    }

    resume() {
        for (;;) {
            const instruction = this._instruction();
            switch (instruction.opcode) {
                case "brk":
                    this._relativeJump(1);
                    return Thread.Status.BREAKPOINT;

                case "call": {
                    const args = Array(instruction.arguments);
                    for (let i = args.length - 1; i >= 0; --i) {
                        args[i] = this._pop();
                    }
                    const sub = this._pop();
                    this._relativeJump(1);
                    this.callStack.push(new Thread.StackFrame(sub, args));
                    break;
                }

                case "dup": {
                    const value = this._pop();
                    this._push(value);
                    this._push(value);
                    this._relativeJump(1);
                    break;
                }

                case "ldarg": {
                    const value = this._topStackFrame().arguments[instruction.argument];
                    this._push(value);
                    this._relativeJump(1);
                    break;
                }

                case "ldfld": {
                    const target = this._pop();
                    const value = target.getField(instruction.field);
                    this._push(value);
                    this._relativeJump(1);
                    break;
                }

                case "ldgbl": {
                    const value = this._globalMap.givenName(instruction.name);
                    this._push(value);
                    this._relativeJump(1);
                    break;
                }

                case "ldloc": {
                    const value = this._topStackFrame().locals[instruction.index];
                    this._push(value);
                    this._relativeJump(1);
                    break;
                }

                case "ldstr": {
                    const value = this._typeLoader.fromDescriptor("S").new(instruction.value);
                    this._push(value);
                    this._relativeJump(1);
                    break;
                }

                case "new": {
                    const type = this._typeLoader.fromDescriptor(instruction.type);
                    const value = type.new();
                    this._push(value);
                    this._relativeJump(1);
                    break;
                }

                case "pop": {
                    this._pop();
                    this._relativeJump(1);
                    break;
                }

                case "ret":
                    this.callStack.pop();
                    if (this.callStack.length === 0) {
                        return Thread.Status.FINISHED;
                    }
                    break;

                case "stfld": {
                    const value = this._pop();
                    const target = this._pop();
                    target.setField(instruction.field, value);
                    this._push(target);
                    this._relativeJump(1);
                    break;
                }

                case "stloc": {
                    const value = this._pop();
                    this._topStackFrame().locals[instruction.index] = value;
                    this._relativeJump(1);
                    break;
                }

                case "tailcall": {
                    const args = Array(instruction.arguments);
                    for (let i = args.length - 1; i >= 0; --i) {
                        args[i] = this._pop();
                    }
                    const sub = this._pop();
                    this.callStack.pop();
                    this.callStack.push(new Thread.StackFrame(sub, args));
                    break;
                }

                case "horror.fficontcall": {
                    const args = Array(instruction.arguments + 1);
                    for (let i = args.length - 2; i >= 0; --i) {
                        args[i] = this._pop();
                    }
                    args[args.length - 1] = value => {
                        this._push(value);
                        this._relativeJump(1);
                        this.resume();
                    };
                    instruction.function.apply(null, args);
                    return Thread.Status.PAUSED;
                }

                case "horror.ffiretcall": {
                    const args = Array(instruction.arguments);
                    for (let i = args.length - 1; i >= 0; --i) {
                        args[i] = this._pop();
                    }
                    const value = instruction.function.apply(null, args);
                    this._push(value);
                    this._relativeJump(1);
                    break;
                }

                default:
                    throw new InstructionError();
            }
        }
    }

    _push(value) {
        this.evaluationStack.push(value);
    }

    _pop() {
        return this.evaluationStack.pop();
    }

    _topStackFrame() {
        return this.callStack[this.callStack.length - 1];
    }

    _relativeJump(skip) {
        this._topStackFrame().programCounter += skip;
    }

    _instruction() {
        const stackFrame = this._topStackFrame();
        return stackFrame.code[stackFrame.programCounter];
    }
}

Thread.Status = {
    BREAKPOINT: 0,
    PAUSED: 1,
    FINISHED: 2,
};

Thread.StackFrame = class {
    constructor(sub, args) {
        this.arguments = args;
        this.locals = Array(sub.localCount);
        this.code = sub.body;
        this.programCounter = 0;
    }
};
