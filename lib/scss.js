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
        let res = '';
        let init = true;
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
                if ((c[1].includes("px") || c[1].includes("em")) && (c[1].includes("+") || c[1].includes("-") || c[1].includes("/") || c[1].includes("*"))) {
                    c[1] = math.calc(c[1])
                }
                //
                if (c[0][0] === "$") {
                    c[0] = c[0].substring(1);
                    variables[c[0]] = c[1];
                } else {
                    if (c[1][0] === "$") {
                        c[1] = c[1].substring(1);
                        c[1] = variables[c[1]]
                    }
                    //
                    currentProperty.push(c[0] + ":" + c[1] + ";");
                }
                t = '';
            } else if (ch === "}") {
                if (currentProperty.length) {
                    res += currentSelector.map((item) => ((item.type === "&") ? "" : " ") + item.name).join("");
                    res += "{";
                    res += currentProperty.join("")
                    res += "}";
                    init = false;
                }
                currentSelector.pop();
                currentProperty = (propertyStack.length) ? propertyStack.pop() : [];
            } else {
                t += ch;
            }
        }
        return res;
    }
}