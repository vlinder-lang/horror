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

export function testThreadResumeReturnFinished(test) {
    this.moduleLoader.loadModule("thread.resumeReturnFinished");
    const sub = this.globalMap.givenName("thread.resumeReturnFinished.main");
    const thr = new thread.Thread(this.typeLoader, sub, []);
    const status = thr.resume();
    test.strictEqual(status, thread.Thread.Status.FINISHED);
    test.done();
}

export function testThreadResumeReturnBreakpoint(test) {
    this.moduleLoader.loadModule("thread.resumeReturnBreakpoint");
    const sub = this.globalMap.givenName("thread.resumeReturnBreakpoint.main");
    const thr = new thread.Thread(this.typeLoader, sub, []);
    const status = thr.resume();
    test.strictEqual(status, thread.Thread.Status.BREAKPOINT);
    test.done();
}
