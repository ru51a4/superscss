class args {
    static lex(str) {
        //@mixin spacing($padding, $margin) {
        let res = [];
        let t = '';
        let isType = false;
        for (let i = 0; i <= str.length - 1; i++) {
            if (str[i] === "@") {
                isType = true;
            } else if (isType && str[i] === " ") {
                isType = false;
                if (t) {
                    res.push(t.trim());
                }
                t = "";
            } else if (!isType && (str[i] === "(" || str[i] === ",") || str[i] === ")") {
                if (t) {
                    res.push(t.trim());
                }
                t = "";
            } else {
                t += str[i];
            }
        }
        if (t) {
            res.push(t.trim());
        }
        return res;
    }
}