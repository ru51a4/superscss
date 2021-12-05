class interpalation {
    static lex(str) {
        let res = [];
        let t = '';
        for (let i = 0; i <= str.length - 1; i++) {
            if (str[i] === "#" && str[i + 1] == "{") {
                res.push(t.trim());
                t = "";
                i = i + 1;
            } else if (str[i] === "}") {
                res.push(t.trim());
                t = "";
            } else {
                t += str[i];
            }
        }
        if (t) {
            res.push(t);
        }
        return res;
    }
}