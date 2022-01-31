/*
Parsing of string rep of constituency parse trees.
Inspired by NLTK:
https://www.nltk.org/_modules/nltk/tree.html
*/

// see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

// TODO: a class for Tree, or just use Objects like currently?
function parse_string(string, open_bracket = "(", close_bracket = ")") {
    // TODO: docstring here
    // TODO: error handling
    // prep reg-ex for tokenizing the linearized parse tree
    const open_br = escapeRegExp(open_bracket);
    const close_br = escapeRegExp(close_bracket);
    const node_pattern = `[^\\s${open_br}${close_br}]+`;
    const leaf_pattern = `[^\\s${open_br}${close_br}]+`;
    const token_re_string = `${open_br}\\s*(${node_pattern})?|${close_br}|${leaf_pattern}`;
    const token_re = new RegExp(token_re_string, "g");
    // tokenize the linearized parse tree
    const matches = string.matchAll(token_re);
    let stack = [{ label: null, children: [] }];
    for (const match of matches) {
        // new sub-tree
        if (match[0][0] === open_bracket) {
            stack.push({ label: match[1], children: [] });
        }
        // end sub-tree
        else if (match[0] === close_bracket) {
            const last_tree = stack.pop();
            stack[stack.length - 1].children.push(last_tree);
        }
        // leaf node
        else {
            stack[stack.length - 1].children.push({ label: match[0], children: [] });
        }
    }
    const tree = stack[stack.length - 1].children[0];
    return tree
}