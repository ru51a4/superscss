const math = require("./helpers/math");
const args = require("./helpers/args");
const interpalation = require("./helpers/interpalation");

class scss_node {
    childrens = [];
    type = '';
    selector = '';
    props = [];
    from = 0;
    through = 0;
    forVar = "";
    condition = "";
    args = [];
}

class astBuilder {
    build(str) {
        str = str.split("");
        let next = () => {
            while (str.length) {
                let t = str.shift();
                if (t !== '\n' && t !== "\t") {
                    return t;
                }
            }
        }
        let charIsLetter = (char) => {
            let separators = [" ", "\n", "\t", "\r", ";", "}"]
            return !separators.includes(char)
        }
        let scssTree = [];
        let stack = [];
        let globalVariables = [];
        let t = '';
        let tSelector = '';
        let tType = '';
        let tProp = [];
        let prevCh = '';
        let ch = '';
        while (str.length) {
            prevCh = ch;
            ch = next();
            if (prevCh !== "#" && ch === "{") {
                let el = new scss_node();
                tType = "default";
                t = t.trim();
                if (t.includes("@mixin")) {
                    tType = "mixin";
                    let c = args.lex(t)
                    tSelector = c[1];
                    el.args = c.filter((item, i) => i !== 0 && i !== 1);
                } else if (t.includes("@for")) {
                    tType = "for";
                    let c = t.split(" ");
                    el.forVar = c[1].trim();
                    el.from = c[3].trim();
                    el.through = c[5].trim();
                } else if (t.includes("@if")) {
                    tType = "if"
                    let c = args.lex(t)
                    el.condition = c.filter((item, i) => i !== 0).join("");
                } else if (t.includes("@media")) {
                    tType = "media";
                    tSelector = t;
                } else {
                    if (t[0] === "&") {
                        tType = "&"
                        t = t.substring(1);
                    }
                    tSelector = t;
                }
                t = '';
                el.type = tType;
                tType = '';
                el.selector = tSelector;
                tSelector = '';
                if (tProp.length && stack[stack.length - 1]) {
                    stack[stack.length - 1].props.push(...tProp);
                    tProp = [];
                }
                if (stack[stack.length - 1]) {
                    stack[stack.length - 1].childrens.push(el);
                    stack.push(el);
                } else {
                    stack.push(el);
                }
            } else if (ch === ';') {
                t = t.trim();
                if (t[0] === "$") {
                    let c = t.split(":");
                    c[0] = c[0].trim();
                    c[1] = c[1].trim();
                    globalVariables[c[0]] = c[1];
                } else {
                    if (t.includes("@include")) {
                        let c = args.lex(t)
                        let arg = c.filter((item, i) => i !== 0 && i !== 1);
                        tProp.push({type: "include", value: c[1], args: arg});
                    } else {
                        tProp.push({type: "default", value: t});
                    }
                }
                t = '';
            } else if (!charIsLetter(prevCh) && ch === "}") {
                if (stack.length === 1) {
                    scssTree.push(stack[stack.length - 1]);
                }
                let el = stack.pop();
                el.props.push(...tProp);
                tProp = [];
            } else {
                t += ch;
            }
        }
        return {tree: scssTree, globalVariables};
    }
}

class scssCompiler {
    static compile(str) {
        let builder = new astBuilder();
        let {tree, globalVariables} = builder.build(str);
        let mixins = [];
        let res = [];
        let tRes = [];
        let currentSelector = [];
        let localVariables = [];
        let isOperation = (str) => {
            return (str.includes("px") || str.includes("em")) &&
                (str.includes("+") || str.includes("-") || str.includes("/") || str.includes("*"))
        };
        let getVariable = (name) => {
            if (localVariables[name]) {
                return localVariables[name];
            }
            if (globalVariables[globalVariables[name]]) {
                return getVariable(globalVariables[name]);
            }
            return globalVariables[name];
        };
        let lex_getVariable = (lexfunc, str, getStr = true) => {
            let t = lexfunc(str).map((item) => {
                if (item[0] === "$") {
                    item = getVariable(item);
                }
                return String(item)
            });
            if (getStr) {
                return t.join("")
            } else {
                return t;
            }
        }

        let compile = (node) => {
            if (node.type === "mixin") {
                mixins[node.selector] = node;
            } else if (node.type === "if") {
                let conditionTokens = lex_getVariable(math.lex, node.condition, false);
                let condRes = math.calc(conditionTokens);
                if (condRes) {
                    //todo prop include logic
                    if (node.props.length) {
                        tRes[tRes.length - 1].props.push(...node.props);
                    }
                    node.childrens.forEach((item) => {
                        compile(item);
                    });
                }
            } else if (node.type === "for") {
                for (let i = node.from; i <= node.through; i++) {
                    localVariables[node.forVar] = i;
                    //todo prop include logic
                    if (node.props.length) {
                        let props = node.props.map((nodeProp) => {
                            //get args variables
                            let c = nodeProp.value.split(":");
                            c[0] = c[0].trim();
                            c[1] = c[1].trim();
                            //interpalation
                            c[1] = lex_getVariable(interpalation.lex, c[1])
                            return `${c[0]}:${c[1]}`;
                        });
                        tRes[tRes.length - 1].props.push(...props);
                    }
                    delete localVariables[node.forVar]
                }
                for (let i = node.from; i <= node.through; i++) {
                    localVariables[node.forVar] = i;
                    node.childrens.forEach((item) => {
                        compile(item);
                    });
                    delete localVariables[node.forVar]
                }
            } else {
                let props = [];
                let cs;
                let countEndMediaCs = 0;
                currentSelector.push({str: node.selector, type: (node.type)});
                cs = currentSelector.sort((a, b) => (a.type === "media") ? -1 : 1).map((item) => {
                    if (item.type === "&") {
                        return item.str;
                    } else if (item.type === "default") {
                        return " " + item.str;
                    } else if (item.type === "media") {
                        countEndMediaCs++;
                        return item.str + "{";
                    }
                }).join("");
                //interpalation
                cs = lex_getVariable(interpalation.lex, cs);
                //

                let iForDeleteLocalVariable = [];
                for (let i = 0; i <= node.props.length - 1; i++) {
                    if (node.props[i].type === "include") {
                        let mixin = mixins[node.props[i].value];
                        //args
                        iForDeleteLocalVariable.push((node.childrens.length - 1) + 1);
                        mixin.args.forEach((key, j) => {
                            localVariables[key] = node.props[i].args[j];
                        });
                        //
                        node.props.splice(i + 1, 0, ...mixin.props);
                        node.childrens.push(...mixin.childrens);
                    } else {
                        props.push(node.props[i].value);
                    }
                }
                props = props.map((nodeProp) => {
                    let c = nodeProp.split(":");
                    c[0] = c[0].trim();
                    c[1] = c[1].trim();
                    //interpalation
                    c[1] = lex_getVariable(interpalation.lex, c[1])
                    if (isOperation(c[1])) {
                        c[1] = math.calc(math.lex(c[1]))
                    }
                    return `${c[0]}:${c[1]};`
                })
                tRes.push({lvl: currentSelector.length, cs: cs, props: props, countEndMediaCs})
                node.childrens.forEach((item, i) => {
                    compile(item);
                    //args
                    if (iForDeleteLocalVariable.includes(i)) {
                        item.args.forEach((key) => {
                            delete localVariables[key];
                        });
                        iForDeleteLocalVariable = iForDeleteLocalVariable.filter((j) => j !== i);
                    }
                });
                currentSelector.pop();
            }
        }
        tree.forEach((item) => {
            compile(item);
            res.push(tRes.sort((a, b) => a.lvl - b.lvl).map((item) => {
                let tStr = "";
                tStr += item.cs;
                tStr += "{"
                tStr += item.props.join("");
                tStr += "}"
                for (let i = 0; i < item.countEndMediaCs; i++) {
                    tStr += "}";
                }
                return tStr;
            }).join("\n"));
            tRes = [];
        });
        return res.join("\n");
    }
}
//global.window.superscss = scssCompiler;

module.exports = scssCompiler;
