class math {
    static calc(str) {
        let currentUnit = '';
        str = str.split(" ");
        let stack = [];
        stack.push([]);
        //build AST
        let tCh = '';
        while (str.length) {
            let ch = str.shift();
            if (ch === "(") {
                stack.push([]);
            } else if (ch === ")") {
                if (tCh !== '') {
                    stack[stack.length - 1].push(tCh);
                    tCh = ''
                }
                let t = stack[stack.length - 1];
                stack.pop();
                stack[stack.length - 1].push(t);
            } else {
                if (ch === '*' || ch === "+" || ch === "/" || ch === "-") {
                    if (tCh !== '') {
                        stack[stack.length - 1].push(tCh);
                    }
                    stack[stack.length - 1].push(ch);
                    tCh = '';
                } else {
                    tCh += ch;
                    if (tCh.includes("px")) {
                        currentUnit = 'px';
                        tCh = tCh.substring(0, tCh.length - 2)
                    }
                    if (tCh.includes("em")) {
                        tCh = currentUnit = 'em';
                        tCh = tCh.substring(0, tCh.length - 2)g
                    }
                }


            }
        }
        if (tCh !== '') {
            stack[stack.length - 1].push(tCh);
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


        function calc(arr) {
            for (let i = 0; i <= arr.length - 1; i++) {
                if (arr[i] === "*" || arr[i] === "/") {
                    let t = operators[arr[i]](arr[i - 1], arr[i + 1]);
                    arr.splice(i - 1, 3, t);
                    i = i - 1;
                }
            }
            for (let i = 0; i <= arr.length - 1; i++) {
                if (arr[i] === "+" || arr[i] === "-") {
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
        return start[0] + currentUnit;
    }

}