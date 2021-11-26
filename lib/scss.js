class scssCompiler {
    static compile(str) {
        str = str.split("");
        let isProperty = false;

        let next = () => {
            while (str.length) {
                let t = str.shift();
                if (isProperty) {
                    return t;
                }
                if (t !== ' ' && t !== '\n' && t !== "\t") {
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
        while (str.length) {
            let ch = next();
            if (ch === ":") {
                isProperty = true;
            } else if (ch === ";") {
                isProperty = false;
            }
            if (ch === "{") {
                propertyStack.push(currentProperty);
                currentProperty = [];
                let type = '';
                if (t[0] === "&") {
                    type = "&"
                    t = t.substring(1)
                } else {
                    type = " ";
                }
                currentSelector.push({name: t, type: type})
                t = '';
            } else if (ch === ';') {
                //variables
                let c = t.split(":")
                c[0] = c[0].trim();
                c[1] = c[1].trim();
                //operations

                //variables
                c[1] = c[1].split(" ").map((item) => {
                    if (item[0] === "$") {
                        item = item.substring(1);
                        item = variables[item]
                    }
                    return item;
                }).join(" ");
                if ((c[1].includes("px") || c[1].includes("em")) && (c[1].includes("+") || c[1].includes("-") || c[1].includes("/") || c[1].includes("*"))) {
                    c[1] = math.calc(c[1], variables)
                }
                //
                if (c[0][0] === "$") {
                    c[0] = c[0].substring(1);
                    variables[c[0]] = c[1];
                } else {
                    currentProperty.push(c[0] + ":" + c[1] + ";");
                }
                t = '';
            } else if (ch === "}") {
                if (currentProperty.length) {
                    let tStr = '';
                    tStr += currentSelector.map((item) => ((item.type === "&") ? "" : " ") + item.name).join("");
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
            } else {
                t += ch;
            }
        }
        return res.join("\n");
    }
}