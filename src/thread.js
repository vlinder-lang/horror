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

                case "ldctor": {
                    const type = this._typeLoader.fromDescriptor(instruction.type);
                    const value = type.constructors[instruction.constructor];
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

                case "new": {
                    const type = this._typeLoader.fromDescriptor(instruction.type);
                    const value = Object.create(type.prototype);
                    this._push(value);
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
                    const target = this._pop();
                    const value = this._pop();
                    target['__' + instruction.field] = value;
                    this._relativeJump(1);
                    break;
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
        this.locals = [];
        this.code = sub.body;
        this.programCounter = 0;
    }
};
