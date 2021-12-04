class scss_node {
    childrens = [];
    type = '';
    selector = '';
    props = [];
    from = 0;
    through = 0;
    forVar = "";
    condition = "";
}

class astBuilder {
    build(str) {
        str = str.split("");
        let isProperty = false;
        let next = () => {
            while (str.length) {
                let t = str.shift();
                if (isProperty) {
                    return t;
                }
                if (t !== '\n' && t !== "\t") {
                    return t;
                }
            }
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
                    let c = t.split(" ");
                    tSelector = c[1];
                } else if (t.includes("@for")) {
                    tType = "for";
                    let c = t.split(" ");
                    el.forVar = c[1].trim();
                    el.from = c[3].trim();
                    el.through = c[5].trim();
                } else if (t.includes("@if")) {
                    tType = "if";
                    let c = t.split("(")[1];
                    c = c.substring(0, c.length - 1);
                    el.condition = c;
                } else {
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
                    console.log({el})
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
                        let c = t.split(" ");
                        tProp.push({type: "include", value: c[1]});
                    } else {
                        tProp.push({type: "default", value: t});
                    }
                }
                t = '';
            } else if (ch === "}") {
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
        let tree = builder.build(str);
        let mixins = [];
        let res = [];
        let tRes = [];
        let currentSelector = [];
        let globalVariables = tree.globalVariables;
        tree = tree.tree;
        let isOperation = (str) => {
            return (str.includes("px") || str.includes("em")) &&
                (str.includes("+") || str.includes("-") || str.includes("/") || str.includes("*"))
        };
        let getVariable = (name) => {
            if (globalVariables[globalVariables[name]]) {
                return getVariable(globalVariables[name]);
            }
            return globalVariables[name];
        };

        let compile = (node) => {
            if (node.type === "mixin") {
                mixins[node.selector] = node;
            } else if (node.type === "if") {
                let condRes = conditions.calc(conditions.lex(node.condition));
                if (condRes) {
                    node.childrens.forEach((item) => {
                        compile(item)
                    });
                }

            } else if (node.type === "for") {
                for (let i = node.from; i <= node.through; i++) {
                    node.childrens.forEach((item) => {
                        compile(item)
                    });
                }
            } else {
                currentSelector.push(node.selector);
                let tStr = '';
                tStr += currentSelector.join(" ");
                tStr += "{";
                for (let i = 0; i <= node.props.length - 1; i++) {
                    if (node.props[i].type === "include") {
                        let mixin = mixins[node.props[i].value];
                        node.props.splice(i + 1, 0, ...mixin.props);
                        node.childrens.push(...mixin.childrens);
                    } else {
                        let c = node.props[i].value.split(":");
                        c[0] = c[0].trim();
                        c[1] = c[1].trim().substring(0, c[1].length - 1);
                        c[1] = c[1].split(" ").map((item) => {
                            if (item[0] === "$") {
                                return getVariable(item);
                            }
                            return item
                        }).join(" ");
                        if (isOperation(c[1])) {
                            c[1] = math.calc(math.lex(c[1]))
                        }
                        tStr += `${c[0]}:${c[1]};`;
                    }
                }
                tStr += "}";
                tRes.push({lvl: currentSelector.length, str: tStr})
                node.childrens.forEach((item) => {
                    compile(item);
                });
                currentSelector.pop();
            }
        }
        tree.forEach((item) => {
            compile(item);
            res.push(tRes.sort((a, b) => a.lvl - b.lvl).map((item) => item.str).join("\n"));
            tRes = [];
        });
        return res.join("\n");
    }
}