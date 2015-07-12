import * as fs from "fs";
import * as module from "../src/module";
import * as thread from "../src/thread";
import * as type from "../src/type";

export function setUp(callback) {
    const fetcher = name => {
        return fs.readFileSync(__dirname + "/testdata/" + name.replace(/\./g, "/") + ".millm", "utf-8");
    };
    this.globalMap = new module.GlobalMap();
    this.typeLoader = new type.TypeLoader();
    this.moduleLoader = new module.ModuleLoader(fetcher, this.globalMap, this.typeLoader);
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
    const args = [Object.create(this.typeLoader.fromDescriptor('T;').prototype)];
    const thr = new thread.Thread(this.globalMap, this.typeLoader, sub, args);
    thr.resume();
    test.strictEqual(thr.evaluationStack.length, 1);
    test.strictEqual(thr.evaluationStack[0].type.descriptor, 'T;');
    test.done();
}

export function testThreadLdctor(test) {
    this.moduleLoader.loadModule("thread.ldctor");
    const sub = this.globalMap.givenName("thread.ldctor.main");
    const thr = new thread.Thread(this.globalMap, this.typeLoader, sub);
    thr.resume();
    test.strictEqual(thr.evaluationStack.length, 5);
    for (let element of thr.evaluationStack) {
        test.strictEqual(element.type.descriptor, 'Nthread.ldctor.Level;');
    }
    test.done();
}

export function testThreadLdgbl(test) {
    this.globalMap.registerGlobal("unit", Object.create(this.typeLoader.fromDescriptor("T;").prototype));
    this.moduleLoader.loadModule("thread.ldgbl");
    const sub = this.globalMap.givenName("thread.ldgbl.main");
    const thr = new thread.Thread(this.globalMap, this.typeLoader, sub);
    thr.resume();
    test.strictEqual(thr.evaluationStack.length, 1);
    test.strictEqual(thr.evaluationStack[0].type.descriptor, "T;");
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
