class scssCompiler {
    static compile(str) {
        str = str.split("");
        let isProperty = false;
        let getVariable = (name) => {
            if (variables[variables[name]]) {
                return getVariable(variables[name]);
            }
            return variables[name];
        };

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
        let res = [];
        let tRes = [];
        let currentSelector = [];
        let currentProperty = [];
        let t = '';
        let propertyStack = [];
        let variables = [];
        let currentMixin = undefined;
        let mixins = []
        while (str.length) {
            let ch = next();
            if (ch === ":") {
                isProperty = true;
            } else if (ch === ";") {
                isProperty = false;
            }
            if (ch === "{") {
                let type = '';
                if (t[0] === "&") {
                    type = "&"
                    t = t.substring(1)
                } else {
                    type = " ";
                }
                //mixin
                t = t.trim();
                if (t.includes("@mixin")) {
                    let lexMixin = t.split(" ")[1].split("(");
                    let nameMixin = lexMixin[0];
                    let varMixin = (lexMixin.length === 2) ? lexMixin[1].substring(0, lexMixin[1].length - 1) : "";
                    varMixin = varMixin.split(",");
                    currentMixin = {
                        nameMixin,
                        varMixin,
                        propertyMixin: []
                    };
                } else {
                    propertyStack.push(currentProperty);
                    currentProperty = [];
                    //
                    currentSelector.push({name: t, type: type})
                }
                t = '';
            } else if (ch === ';') {
                if (t.includes("@include")) {
                    t = t.trim();
                    t = t.split(" ")[1].split("(");
                    let name = t[0];
                    let mixvar = t[1].substring(0, t[1].length - 1).split(",")
                    let currMixin = mixins.find(item => item.nameMixin === name);
                    let currVarMixin = currMixin.varMixin;
                    let varsMixin = [];
                    currVarMixin.forEach((item, i) => {
                        varsMixin[item] = mixvar[i];
                    });
                    currMixin.propertyMixin.forEach((item) => {
                        let c = item.split(":");
                        c[1] = c[1].substring(0, c[1].length - 1)
                        c[1] = c[1].split(" ").map((prop) => {
                            if (varsMixin[prop]) {
                                prop = varsMixin[prop];
                            } else if (getVariable(prop.substring(1))) {
                                prop = getVariable(prop.substring(1));
                            }
                            return prop;
                        }).join(" ");
                        currentProperty.push(c[0] + ":" + c[1] + ";");
                    });
                } else {
                    //variables
                    let c = t.split(":")
                    c[0] = c[0].trim();
                    c[1] = c[1].trim();
                    //operations
                    if ((c[1].includes("px") || c[1].includes("em")) && (c[1].includes("+") || c[1].includes("-") || c[1].includes("/") || c[1].includes("*"))) {
                        c[1] = math.lex(c[1]).map((item) => {
                            if (item[0] === "$") {
                                item = item.substring(1);
                                item = getVariable(item);
                            }
                            return item;
                        });
                        c[1] = math.calc(c[1])
                    } else {
                        c[1] = c[1].split(" ").map((item) => {
                            if (item[0] === "$" && !currentMixin) {
                                item = item.substring(1);
                                item = getVariable(item);
                            }
                            return item;
                        }).join(" ");
                    }
                    //
                    if (c[0][0] === "$") {
                        c[0] = c[0].substring(1);
                        variables[c[0]] = c[1];
                    } else {
                        //mixin
                        if (currentMixin !== undefined) {
                            currentMixin.propertyMixin.push(c[0] + ":" + c[1] + ";");
                        } else {
                            currentProperty.push(c[0] + ":" + c[1] + ";");
                        }
                    }
                }
                t = '';
            } else if (ch === "}") {
                if (currentMixin !== undefined) {
                    mixins.push(currentMixin);
                    currentMixin = undefined;
                } else {
                    if (currentProperty.length) {
                        let tStr = '';
                        tStr += currentSelector.map((item, i) => ((item.type === "&") ? "" : " ") + item.name).join("");
                        tStr += "{";
                        tStr += currentProperty.join("")
                        tStr += "}";
                        tRes.push({lvl: currentSelector.length, str: tStr});
                    }
                    currentSelector.pop();
                    currentProperty = (propertyStack.length) ? propertyStack.pop() : [];
                    if (propertyStack.length === 0) {
                        res.push(tRes.sort((a, b) => a.lvl - b.lvl).map((item) => item.str).join("\n"));
                        tRes = [];
                    }
                }
            } else {
                t += ch;
            }
        }
        return res.join("\n");
    }
}