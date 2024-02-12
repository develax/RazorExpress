const raz = (await import("./index.mjs"))
var parser = await raz.getParser();
console.log(await parser.compileAsync("@(new Date())",{settings:{"view engine":"raz"}}))