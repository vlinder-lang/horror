import * as fs from "fs";
import * as module from "../src/module";
import * as thread from "../src/thread";
import * as type from "../src/type";
import * as ffiModule from "./testdata/mill/ffi";

export function setUp(callback) {
    ffiModule.x = null;

    const millModuleFetcher = name => {
        return fs.readFileSync(__dirname + "/testdata/" + name.replace(/\./g, "/") + ".millm", "utf-8");
    };
    const ecmascriptModuleFetcher = name => {
        return require(__dirname + "/testdata/" + name.replace(/\./g, "/"));
    };
    this.globalMap = new module.GlobalMap();
    this.typeLoader = new type.TypeLoader();
    this.moduleLoader = new module.ModuleLoader(millModuleFetcher, ecmascriptModuleFetcher, this.globalMap, this.typeLoader);
    callback();
}

export function testThreadBrk(test) {
    this.moduleLoader.loadModule("thread.brk");
    const sub = this.globalMap.givenName("thread.brk.main");
    const thr = new thread.Thread(this.globalMap, this.typeLoader, sub, []);
    const status = thr.resume();
    test.strictEqual(status, thread.Thread.Status.BREAKPOINT);
    test.done();
}

export function testThreadCall(test) {
    this.moduleLoader.loadModule("thread.call");
    const sub = this.globalMap.givenName("thread.call.main");
    const thr = new thread.Thread(this.globalMap, this.typeLoader, sub, []);

    thr.resume();
    test.strictEqual(thr.callStack.length, 2);
    test.strictEqual(thr.evaluationStack.length, 1);
    test.strictEqual(thr.evaluationStack[0].type.descriptor, "T;");

    thr.resume();
    test.strictEqual(thr.callStack.length, 1);
    test.strictEqual(thr.evaluationStack.length, 1);
    test.strictEqual(thr.evaluationStack[0].type.descriptor, "T;");

    test.done();
}

export function testThreadDup(test) {
    this.moduleLoader.loadModule("thread.dup");
    const sub = this.globalMap.givenName("thread.dup.main");
    const thr = new thread.Thread(this.globalMap, this.typeLoader, sub, []);
    thr.resume();
    test.strictEqual(thr.evaluationStack.length, 2);
    test.strictEqual(thr.evaluationStack[0], thr.evaluationStack[1]);
    test.done();
}

export function testThreadLdarg(test) {
    this.moduleLoader.loadModule("thread.ldarg");
    const sub = this.globalMap.givenName("thread.ldarg.main");
    const args = [this.typeLoader.fromDescriptor('T;').new()];
    const thr = new thread.Thread(this.globalMap, this.typeLoader, sub, args);
    thr.resume();
    test.strictEqual(thr.evaluationStack.length, 1);
    test.strictEqual(thr.evaluationStack[0].type.descriptor, 'T;');
    test.done();
}

export function testThreadLdfld(test) {
    this.moduleLoader.loadModule("thread.ldfld");
    const sub = this.globalMap.givenName("thread.ldfld.main");
    const thr = new thread.Thread(this.globalMap, this.typeLoader, sub, []);
    thr.resume();
    test.strictEqual(thr.evaluationStack.length, 1);
    test.strictEqual(thr.evaluationStack[0].type.descriptor, "T;");
    test.done();
}

export function testThreadLdgbl(test) {
    this.globalMap.registerGlobal("unit", this.typeLoader.fromDescriptor("T;").new());
    this.moduleLoader.loadModule("thread.ldgbl");
    const sub = this.globalMap.givenName("thread.ldgbl.main");
    const thr = new thread.Thread(this.globalMap, this.typeLoader, sub);
    thr.resume();
    test.strictEqual(thr.evaluationStack.length, 1);
    test.strictEqual(thr.evaluationStack[0].type.descriptor, "T;");
    test.done();
}

export function testThreadLdlocStloc(test) {
    this.moduleLoader.loadModule("thread.ldloc_stloc");
    const sub = this.globalMap.givenName("thread.ldloc_stloc.main");
    const thr = new thread.Thread(this.globalMap, this.typeLoader, sub, []);
    thr.resume();
    test.strictEqual(thr.callStack[0].locals[0].type.descriptor, "T;");
    test.strictEqual(thr.evaluationStack.length, 0);
    thr.resume();
    test.strictEqual(thr.callStack[0].locals[0].type.descriptor, "T;");
    test.strictEqual(thr.evaluationStack.length, 1);
    test.strictEqual(thr.evaluationStack[0].type.descriptor, "T;");
    test.done();
}

export function testThreadLdstr(test) {
    this.moduleLoader.loadModule("thread.ldstr");
    const sub = this.globalMap.givenName("thread.ldstr.main");
    const thr = new thread.Thread(this.globalMap, this.typeLoader, sub, []);
    thr.resume();
    test.strictEqual(thr.evaluationStack.length, 1);
    test.strictEqual(thr.evaluationStack[0].type.descriptor, "S");
    test.strictEqual(thr.evaluationStack[0].value, "Hello, world!");
    test.done();
}

export function testThreadNew(test) {
    this.moduleLoader.loadModule("thread.new");
    const sub = this.globalMap.givenName("thread.new.main");
    const thr = new thread.Thread(this.globalMap, this.typeLoader, sub);
    thr.resume();
    test.strictEqual(thr.evaluationStack.length, 1);
    test.strictEqual(thr.evaluationStack[0].type.descriptor, "T;");
    test.done();
}

export function testThreadPop(test) {
    this.moduleLoader.loadModule("thread.pop");
    const sub = this.globalMap.givenName("thread.pop.main");
    const thr = new thread.Thread(this.globalMap, this.typeLoader, sub, []);
    thr.resume();
    test.strictEqual(thr.evaluationStack.length, 0);
    test.done();
}

export function testThreadRet(test) {
    this.moduleLoader.loadModule("thread.ret");
    const sub = this.globalMap.givenName("thread.ret.main");
    const thr = new thread.Thread(this.globalMap, this.typeLoader, sub, []);
    const status = thr.resume();
    test.strictEqual(status, thread.Thread.Status.FINISHED);
    test.done();
}

export function testThreadStfld(test) {
    this.moduleLoader.loadModule("thread.stfld");
    const sub = this.globalMap.givenName("thread.stfld.main");
    const thr = new thread.Thread(this.globalMap, this.typeLoader, sub, []);
    thr.resume();
    test.strictEqual(thr.evaluationStack.length, 1);
    test.strictEqual(thr.evaluationStack[0].type.descriptor, "TT;T;T;;");
    test.strictEqual(thr.evaluationStack[0].getField('0').type.descriptor, "T;");
    test.strictEqual(thr.evaluationStack[0].getField('1').type.descriptor, "T;");
    test.strictEqual(thr.evaluationStack[0].getField('2').type.descriptor, "T;");
    test.done();
}

export function testThreadHorror_ffiretcall(test) {
    this.moduleLoader.loadModule("thread.horror_ffiretcall");
    const sub = this.globalMap.givenName("thread.horror_ffiretcall.main");
    const thr = new thread.Thread(this.globalMap, this.typeLoader, sub, []);
    thr.resume();
    test.strictEqual(thr.evaluationStack.length, 1);
    test.strictEqual(thr.evaluationStack[0].type.descriptor, "T;");
    test.strictEqual(ffiModule.x.type.descriptor, "T;");
    test.done();
}
