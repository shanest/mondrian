/*
Parsing of string rep of constituency parse trees.
Inspired by NLTK:
https://www.nltk.org/_modules/nltk/tree.html
*/

// see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions
const escapeRegExp = function escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

interface Tree {
    label: string;
    children: Array<Tree>;
}

const parse_string = function parse_string(string: string, open_bracket: string = "(", close_bracket: string = ")"): Tree {
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
    let stack: Array<Tree> = [{ label: "", children: [] }];
    for (const match of matches) {
        // new sub-tree
        if (match[0][0] === open_bracket) {
            stack.push({ label: match[1], children: [] });
        }
        // end sub-tree
        else if (match[0] === close_bracket) {
            const last_tree: Tree | undefined = stack.pop();
            if (last_tree === undefined) {
                console.log("Parsing error")
            } else {
                stack[stack.length - 1].children.push(last_tree);
            }
        }
        // leaf node
        else {
            stack[stack.length - 1].children.push({ label: match[0], children: [] });
        }
    }
    const tree: Tree = stack[stack.length - 1].children[0];
    return tree;
}