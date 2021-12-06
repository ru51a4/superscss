class math {
    static lex(str) {
        let res = [];
        let t = '';
        for (let i = 0; i <= str.length - 1; i++) {
            if (str[i] === ' ') {
                continue
            }
            if (str[i] === '%' || str[i] === '/' || str[i] === '*' || str[i] === '-' || str[i] === '+' || str[i] === '(' || str[i] === ')') {
                if (t) {
                    res.push(t);
                }
                res.push(str[i]);
                t = '';
            } else if ((str[i] === ">" && str[i + 1] === "=") || (str[i] === "<" && str[i + 1] === "=")
                || (str[i] === "=" && str[i + 1] === "=")) {
                if (t) {
                    res.push(t);
                }
                res.push(str[i] + str[i + 1]);
                t = '';
                i = i + 1;
            } else if (str[i] === '<' || str[i] === '>' || str[i] === '(' || str[i] === ')') {
                if (t) {
                    res.push(t);
                }
                res.push(str[i]);
                t = '';
            } else {
                t += str[i];
            }
        }
        if (t) {
            res.push(t);
        }
        return res;
    }

    static calc(str) {
        let currentUnit = '';
        let stack = [];
        stack.push([]);
        //build AST
        while (str.length) {
            let item = str.shift();
            if (item === "(") {
                stack.push([]);
            } else if (item === ")") {
                let t = stack[stack.length - 1];
                stack.pop();
                stack[stack.length - 1].push(t);
            } else {
                if (item.includes("rem")) {
                    currentUnit = 'rem';
                    item = item.substring(0, item.length - 3)
                } else if (item.includes("px")) {
                    currentUnit = 'px';
                    item = item.substring(0, item.length - 2)
                } else if (item.includes("em")) {
                    currentUnit = 'em';
                    item = item.substring(0, item.length - 2)
                } else if (item.includes("%") && item.length > 1) {
                    currentUnit = '%';
                    item = item.substring(0, item.length - 1)
                }
                stack[stack.length - 1].push(item);
            }
        }

        //calc
        let start = stack[0];
        let operators = [];
        operators["+"] = (a, b) => {
            return parseInt(a) + parseInt(b);
        }
        operators["-"] = (a, b) => {
            return parseInt(a) - parseInt(b);
        }
        operators["*"] = (a, b) => {
            return parseInt(a) * parseInt(b);
        }
        operators["/"] = (a, b) => {
            return parseInt(a) / parseInt(b);
        }
        operators[">"] = (a, b) => {
            return parseInt(a) > parseInt(b);
        }
        operators[">="] = (a, b) => {
            return parseInt(a) >= parseInt(b);
        }
        operators["<="] = (a, b) => {
            return parseInt(a) <= parseInt(b);
        }
        operators["<"] = (a, b) => {
            return parseInt(a) < parseInt(b);
        }
        operators["=="] = (a, b) => {
            return parseInt(a) === parseInt(b);
        }
        operators["%"] = (a, b) => {
            return parseInt(a) % parseInt(b);
        }


        function calc(arr) {
            for (let i = 0; i <= arr.length - 1; i++) {
                if (arr[i] === "*" || arr[i] === "/") {
                    let t = operators[arr[i]](arr[i - 1], arr[i + 1]);
                    arr.splice(i - 1, 3, t);
                    i = i - 1;
                }
            }
            for (let i = 0; i <= arr.length - 1; i++) {
                if (arr[i] === "%" || arr[i] === "+" || arr[i] === "-") {
                    let t = operators[arr[i]](arr[i - 1], arr[i + 1]);
                    arr.splice(i - 1, 3, t);
                    i = i - 1;
                }
            }
            for (let i = 0; i <= arr.length - 1; i++) {
                if (arr[i] === "<=" || arr[i] === ">=" || arr[i] === "==" || arr[i] === ">" || arr[i] === "<") {
                    let t = operators[arr[i]](arr[i - 1], arr[i + 1]);
                    arr.splice(i - 1, 3, t);
                    i = i - 1;
                }
            }
        }

        function deep(arr) {
            for (let i = 0; i <= arr.length - 1; i++) {
                if (Array.isArray(arr[i])) {
                    if (arr[i].length === 1) {
                        arr[i] = arr[i][0];
                    } else {
                        deep(arr[i]);
                        i = i - 1;
                    }
                }
            }
            calc(arr);
        }

        deep(start);
        if (start[0] == false) {
            return false
        }
        return start[0] + currentUnit;
    }

}