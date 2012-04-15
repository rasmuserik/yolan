var tokenRegEx = RegExp.call(RegExp, "\\s*(\\[|\\]|(\\\\.|[^\\s\\[\\]])+)", "g");

var unescapeRegEx = RegExp.call(RegExp, "\\\\(.)", "g");

var yolan = {};

yolan.tokenize = function(str) {
    var result = [];
    str.replace(tokenRegEx, function(_, token) {
        return result.push(token);
    });
    return result;
};

yolan.parse = function(tokens) {
    tokens = tokens.reverse();
    var stack = [];
    var current = [ "do" ];
    while (tokens["length"]) {
        var token = tokens.pop();
        if (token === "[") {
            stack.push(current);
            current = [];
        } else if (token === "]") {
            var t = current;
            current = stack.pop();
            current.push(t);
        } else if (true) {
            current.push(token.replace(unescapeRegEx, function(_, a) {
                return a;
            }));
        }
    }
    return current;
};

var compileJS = {
    JsTypeOf: function(syn, syn1) {
        return "typeof " + syn1;
    },
    "do": function(syn) {
        return syn.slice(1).map(yolan["toJS"]).join(";");
    },
    def: function(syn, syn1) {
        return "var " + syn1 + "=" + yolan.toJS(syn[2]);
    },
    set: function(syn, syn1) {
        return syn1 + "=" + yolan.toJS(syn[2]);
    },
    object: function(syn, syn1) {
        return "{" + syn.slice(1).map(function(pair) {
            return JSON.stringify(pair[0].toString()) + ":" + yolan.toJS(pair[1]);
        }).join(",") + "}";
    },
    array: function(syn, syn1) {
        return "[" + syn.slice(1).map(yolan["toJS"]).join(",") + "]";
    },
    fn: function(syn, syn1) {
        return "function(" + syn1.join(",") + "){" + syn.slice(2, -1).map(yolan["toJS"]).join(";") + ";return " + yolan.toJS(syn[syn["length"] - 1]) + "}";
    },
    "while": function(syn, syn1) {
        return "while(" + yolan.toJS(syn1) + "){" + syn.slice(2).map(yolan["toJS"]).join(";") + "}";
    },
    cond: function(syn) {
        return syn.slice(1).map(function(pair) {
            return "if(" + yolan.toJS(pair[0]) + "){" + pair.slice(1).map(yolan["toJS"]).join(";") + "}";
        }).join("else ");
    },
    "#": function() {
        return "";
    },
    "return": function(syn, syn1) {
        return "return " + yolan.toJS(syn1);
    },
    "throw": function(syn, syn1) {
        return "throw " + yolan.toJS(syn1);
    },
    "+": function(syn) {
        return syn.slice(1).map(yolan["toJS"]).join("+");
    },
    "-": function(syn) {
        return syn.slice(1).map(yolan["toJS"]).join("-");
    },
    "eq?": function(syn, syn1) {
        return yolan.toJS(syn1) + "===" + yolan.toJS(syn[2]);
    }
};

yolan.toJS = function(syn) {
    var syn0 = syn[0];
    var syn1 = syn[1];
    if (typeof syn === "string") {
        return syn;
    } else if (compileJS[syn0]) {
        return compileJS[syn0].call(null, syn, syn1);
    } else if (syn1 === "set") {
        return yolan.toJS(syn0) + "." + syn[2] + "=" + yolan.toJS(syn[3]);
    } else if (syn1 === "get") {
        return yolan.toJS(syn0) + "[" + yolan.toJS(syn[2]) + "]";
    } else if (typeof syn0 === "string") {
        return yolan.toJS(syn0) + "." + syn1 + "(" + syn.slice(2).map(yolan["toJS"]).join(",") + ")";
    }
    return yolan.toJS(syn0) + "." + syn1 + "(" + syn.slice(2).map(yolan["toJS"]).join(",") + ")";
};

var action = process["argv"][2];

if (action === "compile") {
    var fs = require.call(null, "fs");
    fs.readFile(process["argv"][3], "utf8", function(err, data) {
        if (err) {
            return err;
        }
        var js = yolan.toJS(yolan.parse(yolan.tokenize(data)));
        var uglify = require.call(null, "uglify-js");
        var jsp = uglify["parser"];
        var pro = uglify["uglify"];
        var ast = jsp.parse(js);
        js = pro.gen_code(ast, {
            beautify: true
        });
        return fs.writeFile(process["argv"][4], js, function(err, data) {
            if (err) {
                return err;
            }
            return true;
        });
    });
} else if (action === "hello") {
    console.log("hello");
}